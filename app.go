package main

import (
	"context"
	"encoding/json"
	"fmt"
	"log"
	"time"

	"github.com/boltdb/bolt"
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

func (a *App) ExecCommand(command Command) {
	a.boltDB.Update(func(tx *bolt.Tx) error {
		b := tx.Bucket([]byte("command"))
		err := b.Put([]byte(command.Name), []byte(command.Data))
		return err
	})
}
