package commands

import (
	"fmt"
	"runtime"

	"github.com/bwmarrin/discordgo"
)

func statsCommand(s *discordgo.Session, m *discordgo.MessageCreate, params []string) error {
	var memStats runtime.MemStats
	runtime.ReadMemStats(&memStats)

	sysMem := fmt.Sprintf("%dMB", memStats.HeapInuse/1000000)
	state := s.State

	guilds := len(state.Guilds)
	channels := 0
	members := 0
	gCop := state.Guilds

	for _, g := range gCop {
		channels += len(g.Channels)
		members += len(g.Members)
	}

	s.ChannelMessageSendEmbed(m.ChannelID, &discordgo.MessageEmbed{
		Title: "Basic Statistics",
		Fields: []*discordgo.MessageEmbedField{
			&discordgo.MessageEmbedField{Name: "Guilds", Value: fmt.Sprint(guilds), Inline: true},
			&discordgo.MessageEmbedField{Name: "Channels", Value: fmt.Sprint(channels), Inline: true},
			&discordgo.MessageEmbedField{Name: "Members", Value: fmt.Sprint(members), Inline: true},
			&discordgo.MessageEmbedField{Name: "Memory", Value: sysMem, Inline: true},
			&discordgo.MessageEmbedField{Name: "Goroutines", Value: fmt.Sprint(runtime.NumGoroutine()), Inline: true},
			&discordgo.MessageEmbedField{Name: "Go Version", Value: runtime.Version(), Inline: true},
			// NEXT: replace go version with feeds setup?
		},
	})

	return nil
}

func init() {
	stats := Command{
		Name:        "stats",
		Usage:       "stats",
		Description: "View bot statistics",
		Category:    "Misc",
		Args:        map[string]bool{},
		OwnerOnly:   false,
		Run:         statsCommand,
	}

	stats.Register()
}
