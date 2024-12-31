package main

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"log"
	"os"
	"strings"
	"time"

	"github.com/boltdb/bolt"
	"golang.org/x/crypto/ssh"
)

// App struct
type App struct {
	ctx    context.Context
	boltDB *bolt.DB
}

// NewApp creates a new App application struct
func NewApp() *App {

	db, err := bolt.Open("my.db", 0600, nil)
	if err != nil {
		log.Fatal(err)
	}
	db.Update(func(tx *bolt.Tx) error {
		_, err := tx.CreateBucketIfNotExists([]byte("server"))
		if err != nil {
			log.Fatal(err)
		}
		_, err = tx.CreateBucketIfNotExists([]byte("command"))
		if err != nil {
			log.Fatal(err)
		}
		return nil
	})
	return &App{
		boltDB: db,
	}
}

// startup is called when the app starts. The context is saved
// so we can call the runtime methods
func (a *App) startup(ctx context.Context) {
	a.ctx = ctx
}

func (a *App) shutdown(ctx context.Context) {

}

// Greet returns a greeting for the given name
func (a *App) Greet(name string) string {
	return fmt.Sprintf("Hello %s, It's show time!", name)
}

type Server struct {
	ID       string `json:"id"`
	Name     string `json:"name"`
	IP       string `json:"ip"`
	User     string `json:"user"`
	Password string `json:"password"`
	Port     string `json:"port"`
}

func (a *App) GetServers() []Server {
	data := map[string]string{}
	a.boltDB.View(func(tx *bolt.Tx) error {
		b := tx.Bucket([]byte("server"))
		b.ForEach(func(k, v []byte) error {
			data[string(k)] = string(v)
			return nil
		})
		return nil
	})
	servers := []Server{}
	for k, v := range data {
		tmpData := &Server{}
		if err := json.Unmarshal([]byte(v), tmpData); err == nil {
			servers = append(servers, Server{
				ID:       k,
				Name:     tmpData.Name,
				IP:       tmpData.IP,
				User:     tmpData.User,
				Password: tmpData.Password,
				Port:     tmpData.Port,
			})
		}
	}
	return servers
}

// ModifyServer ...
//
//	@param server
func (a *App) AddServer(server Server) {
	id := fmt.Sprintf("%d", time.Now().Unix())
	server.ID = id
	data, _ := json.Marshal(server)
	a.boltDB.Update(func(tx *bolt.Tx) error {
		b := tx.Bucket([]byte("server"))
		err := b.Put([]byte(id), data)
		return err
	})
}

func (a *App) RemoveServer(id string) {
	a.boltDB.Update(func(tx *bolt.Tx) error {
		b := tx.Bucket([]byte("server"))
		err := b.Delete([]byte(id))
		return err
	})
}

type Command struct {
	ID   string `json:"id"`
	Name string `json:"name"`
	Data string `json:"data"`
}

func (a *App) GetCommands() []Command {
	data := map[string]string{}
	a.boltDB.View(func(tx *bolt.Tx) error {
		b := tx.Bucket([]byte("command"))
		b.ForEach(func(k, v []byte) error {
			data[string(k)] = string(v)
			return nil
		})
		return nil
	})
	commands := []Command{}
	for k, v := range data {
		tmpData := &Command{}
		if err := json.Unmarshal([]byte(v), tmpData); err == nil {
			commands = append(commands, Command{
				ID:   k,
				Name: tmpData.Name,
				Data: tmpData.Data,
			})
		}
	}
	return commands
}

func (a *App) RemoveCommand(id string) {
	a.boltDB.Update(func(tx *bolt.Tx) error {
		b := tx.Bucket([]byte("command"))
		err := b.Delete([]byte(id))
		return err
	})
}

func (a *App) AddCommand(command Command) {
	id := fmt.Sprintf("%d", time.Now().Unix())
	command.ID = id
	data, _ := json.Marshal(command)
	a.boltDB.Update(func(tx *bolt.Tx) error {
		b := tx.Bucket([]byte("command"))
		err := b.Put([]byte(command.ID), data)
		return err
	})
}

func (a *App) ExecCommand(serverID, command string) error {
	server := &Server{}
	err := a.boltDB.View(func(tx *bolt.Tx) error {
		bytes := tx.Bucket([]byte("server")).Get([]byte(serverID))
		if err := json.Unmarshal(bytes, server); err != nil {
			return fmt.Errorf("json unmarshal server error:%v", err)
		}
		return nil
	})

	if err != nil {
		return err
	}

	config := &ssh.ClientConfig{
		User:            server.User,
		Auth:            []ssh.AuthMethod{ssh.Password(server.Password)},
		HostKeyCallback: ssh.InsecureIgnoreHostKey(),
	}
	sshClient, err := ssh.Dial("tcp", server.IP+":"+server.Port, config)
	if err != nil {
		return fmt.Errorf("dial error: %v", err)
	}

	commands := strings.Split(command, "\n")
	for _, item := range commands {
		fmt.Println("command: ", item)
		session, err := sshClient.NewSession()
		if err != nil {
			return fmt.Errorf("new session error: %v", err)
		}
		//session.RequestPty("bash", 80, 40, ssh.TerminalModes{})
		session.Stdout = NewExecCommandWriter(a.ctx, "stdout")
		session.Stderr = NewExecCommandWriter(a.ctx, "stderr")
		if err := session.Run(item); err != nil {
			session.Close()
			return fmt.Errorf("run command error: %v, command = %s", err, item)
		}
		session.Close()
	}

	return nil
}

type SimpleExecCmdResult struct {
	Code   int    `json:"code"`
	Output string `json:"output"`
}

func (a *App) SimpleExecCommand(serverID, command string) SimpleExecCmdResult {
	writer := bytes.NewBuffer([]byte{})
	server := &Server{}
	err := a.boltDB.View(func(tx *bolt.Tx) error {
		bytes := tx.Bucket([]byte("server")).Get([]byte(serverID))
		if err := json.Unmarshal(bytes, server); err != nil {
			return fmt.Errorf("json unmarshal server error:%v", err)
		}
		return nil
	})

	if err != nil {
		writer.WriteString(fmt.Sprintf("get server error: %v", err))
		return SimpleExecCmdResult{
			Code:   -1,
			Output: writer.String(),
		}
	}

	config := &ssh.ClientConfig{
		User:            server.User,
		Auth:            []ssh.AuthMethod{ssh.Password(server.Password)},
		HostKeyCallback: ssh.InsecureIgnoreHostKey(),
	}
	sshClient, err := ssh.Dial("tcp", server.IP+":"+server.Port, config)
	if err != nil {
		writer.WriteString(fmt.Sprintf("dial error: %v", err))
		return SimpleExecCmdResult{
			Code:   -1,
			Output: writer.String(),
		}
	}

	session, err := sshClient.NewSession()
	if err != nil {
		writer.WriteString(fmt.Sprintf("new session error: %v", err))
		return SimpleExecCmdResult{
			Code:   -1,
			Output: writer.String(),
		}
	}

	session.Stdout = os.Stdout
	session.Stderr = writer
	defer session.Close()
	if err := session.Run(command); err != nil {
		writer.WriteString(fmt.Sprintf("run command error: %v, command = %s", err, command))
		return SimpleExecCmdResult{
			Code:   -1,
			Output: writer.String(),
		}
	}
	return SimpleExecCmdResult{
		Code:   0,
		Output: writer.String(),
	}
}
