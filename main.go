package main

import (
	"log"
	"os"
	"os/signal"
	"syscall"
	"time"

	"github.com/DiscordFeeds/worker/commands"
	"github.com/DiscordFeeds/worker/internal/pkg/shardmanager"
	"github.com/bwmarrin/discordgo"
	"github.com/joho/godotenv"
	"github.com/rs/zerolog"
)

var zlog = zerolog.New(zerolog.ConsoleWriter{
	Out:        os.Stdout,
	TimeFormat: time.Stamp,
}).With().Timestamp().Logger()

func main() {
	err := godotenv.Load()
	if err != nil {
		panic(err)
	}

	token := os.Getenv("DISCORD_TOKEN")

	manager := shardmanager.New("Bot " + token)
	manager.Name = "DiscordFeeds"
	manager.LogChannel = "717340078908899338"
	manager.StatusMessageChannel = "717340726375219280"

	manager.AddHandler(onMessage)

	manager.Start()

	sc := make(chan os.Signal, 1)
	signal.Notify(sc, syscall.SIGINT, syscall.SIGTERM, os.Interrupt, os.Kill)
	<-sc

	log.Printf("[Main] Cleanly stopping shards.")
	manager.StopAll()
}

func onMessage(session *discordgo.Session, message *discordgo.MessageCreate) {
	go commands.CheckCommands(session, message)
}
