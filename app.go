package main

import (
	"context"
	"encoding/json"
	"fmt"
	"log"

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
	Name     string `json:"name"`
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
		json.Unmarshal([]byte(v), tmpData)
		servers = append(servers, Server{
			Name:     k,
			User:     tmpData.User,
			Password: tmpData.Password,
			Port:     tmpData.Port,
		})
	}
	return servers
}

// ModifyServer ...
//
//	@param server
func (a *App) ModifyServer(server Server) {
	data, _ := json.Marshal(server)
	a.boltDB.Update(func(tx *bolt.Tx) error {
		b := tx.Bucket([]byte("server"))
		err := b.Put([]byte(server.Name), data)
		return err
	})
}

func (a *App) RemoveServer(name string) {
	a.boltDB.Update(func(tx *bolt.Tx) error {
		b := tx.Bucket([]byte("server"))
		err := b.Delete([]byte(name))
		return err
	})
}

type Command struct {
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
		commands = append(commands, Command{
			Name: k,
			Data: v,
		})
	}
	return commands
}

func (a *App) RemoveCommand(name string) {
	a.boltDB.Update(func(tx *bolt.Tx) error {
		b := tx.Bucket([]byte("command"))
		err := b.Delete([]byte(name))
		return err
	})
}

func (a *App) ModifyCommand(command Command) {
	a.boltDB.Update(func(tx *bolt.Tx) error {
		b := tx.Bucket([]byte("command"))
		err := b.Put([]byte(command.Name), []byte(command.Data))
		return err
	})
}
