package main

import (
	"os"
	"os/signal"
	"syscall"

	"github.com/SocialFeedsBot/worker/commands"
	"github.com/SocialFeedsBot/worker/internal/logger"
	"github.com/SocialFeedsBot/worker/internal/shardmanager"
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

	// Create shard manager
	manager := shardmanager.New("Bot " + os.Getenv("TOKEN"))
	manager.LogChannel = os.Getenv("LOG_CHANNEL")
	manager.StatusMessageChannel = os.Getenv("STATUS_CHANNEL")

	manager.SetNumShards(1)

	logrus.Info("Starting the shard manager")
	err := manager.Start()
	if err != nil {
		logrus.Fatal("Faled to start: ", err)
		return
	}

	// Handlers
	commands.AddHandler(manager)

	// Keep the process running until kill signals
	sc := make(chan os.Signal, 1)
	signal.Notify(sc, syscall.SIGINT, syscall.SIGTERM, os.Interrupt)
	<-sc

	// Cleanly close the shards
	logrus.Info("Stopping running shards")
	manager.StopAll()
}
