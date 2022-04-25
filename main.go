package main

import (
	"bytes"
	"encoding/json"
	"fmt"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"

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

	session.ShardManager.StatusMessageChannel = os.Getenv("SHARD_STATUS")
	session.ShardManager.LogChannel = os.Getenv("MANAGER_LOG")

	logrus.Info("Starting the shard manager")
	err := session.ShardManager.Start()
	if err != nil {
		logrus.Fatal("Faled to start: ", err)
		return
	}

	if os.Getenv("BETA") != "yes" {
		go startStatInterval(manager)
	}

	// Keep the process running until kill signals
	sc := make(chan os.Signal, 1)
	signal.Notify(sc, syscall.SIGINT, syscall.SIGTERM, os.Interrupt)
	<-sc

	// Cleanly close the shards
	logrus.Info("Stopping running shards")
	session.ShardManager.StopAll()
}

func startStatInterval(manager *shardmanager.Manager) {
	/*

		req, err := http.NewRequest("GET", "http://example.com", nil)
		// ...
		req.Header.Add("If-None-Match", `W/"wyzzy"`)
		resp, err := client.Do(req)
	*/

	client := &http.Client{}

	ticker := time.NewTicker(60 * time.Second)
	quit := make(chan struct{})
	go func() {
		for {
			select {
			case <-ticker.C:
				guildCount := manager.GetFullStatus().NumGuilds

				// prom
				re, _ := http.NewRequest("POST", fmt.Sprintf("%v/gauge/set/guilds/%v", os.Getenv("PROMETHEUS_URL"), guildCount), bytes.NewBufferString(""))
				client.Do(re)

				// top.gg
				topggValues := map[string]string{"server_count": fmt.Sprintf("%v", guildCount)}
				topggData, _ := json.Marshal(topggValues)
				topgg, _ := http.NewRequest("POST", fmt.Sprintf("https://top.gg/api/bots/%v/stats", os.Getenv("CLIENT_ID")), bytes.NewBuffer(topggData))
				topgg.Header.Add("Authorization", os.Getenv("STATS_TOPGG"))
				client.Do(topgg)

				// dbl.com
				dblValues := map[string]string{"guildCount": fmt.Sprintf("%v", guildCount)}
				dblData, _ := json.Marshal(dblValues)
				dbl, _ := http.NewRequest("POST", fmt.Sprintf("https://discord.bots.gg/api/v1/bots/%v/stats", os.Getenv("CLIENT_ID")), bytes.NewBuffer(dblData))
				dbl.Header.Add("Authorization", os.Getenv("STATS_DBL"))
				client.Do(dbl)

				// discord.bots.gg
				dbotsValues := map[string]string{"guildCount": fmt.Sprintf("%v", guildCount)}
				dbotsData, _ := json.Marshal(dbotsValues)
				dbots, _ := http.NewRequest("POST", fmt.Sprintf("https://discord.bots.gg/api/v1/bots/%v/stats", os.Getenv("CLIENT_ID")), bytes.NewBuffer(dbotsData))
				dbots.Header.Add("Authorization", os.Getenv("STATS_DBOTS"))
				client.Do(dbots)
			case <-quit:
				ticker.Stop()
				return
			}
		}
	}()
}
