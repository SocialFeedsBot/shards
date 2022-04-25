package main

import (
	"os"
	"os/signal"
	"syscall"

	"github.com/SocialFeedsBot/shards/gateway"
	"github.com/SocialFeedsBot/shards/internal/logger"
	"github.com/SocialFeedsBot/shards/internal/shardmanager"
	env "github.com/joho/godotenv"
	"github.com/sirupsen/logrus"
)

func main() {
	// Format the logger
	logger.Format()

	// Load environment variables
	e := env.Load()
	if e != nil {
		logrus.Error(e)
		return
	}

	// Connect to the gateway
	gateway := gateway.Gateway{
		Address: os.Getenv("WEBSOCKET"),
		Secret:  os.Getenv("SECRET"),
	}

	// Create shard manager
	manager := shardmanager.New("Bot " + os.Getenv("TOKEN"))
	session := gateway.CreateSessionWithShardManager(manager)

	session.ShardManager.LogChannel = os.Getenv("MANAGER_LOG")

	logrus.Info("Starting the shard manager")
	err := session.ShardManager.Start()
	if err != nil {
		logrus.Fatal("Faled to start: ", err)
		return
	}

	// Keep the process running until kill signals
	sc := make(chan os.Signal, 1)
	signal.Notify(sc, syscall.SIGINT, syscall.SIGTERM, os.Interrupt)
	<-sc

	// Cleanly close the shards
	logrus.Info("Stopping running shards")
	session.ShardManager.StopAll()
}
