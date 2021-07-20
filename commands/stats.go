package commands

import (
	"fmt"
	"runtime"

	"github.com/SocialFeedsBot/worker/api"
	"github.com/bwmarrin/discordgo"
	"golang.org/x/text/language"
	"golang.org/x/text/message"
)

func statsCommand(c *Context, parameters []string) error {
	status := c.Manager.GetFullStatus()
	totalCounts, err := api.DefaultAPI.GetFeedCounts()
	if err != nil {
		return err
	}

	guildCounts, err := api.DefaultAPI.GetGuildFeeds(c.Message.GuildID)
	if err != nil {
		return err
	}

	var memStats runtime.MemStats
	runtime.ReadMemStats(&memStats)

	p := message.NewPrinter(language.English)

	generalTemplate := `:white_small_square: Servers: %v (%v on shard)
		:white_small_square: Shards: %v
		:white_small_square: Memory: %vMB`

	feedsTemplate := `:white_small_square: This server: %v :white_small_square: Global: %v`

	_, err = c.Session.ChannelMessageSendEmbed(c.Message.ChannelID, &discordgo.MessageEmbed{
		Title: "SocialFeeds Statistics",
		Color: 0xE67E22,
		Fields: []*discordgo.MessageEmbedField{
			{
				Name:   "General",
				Value:  fmt.Sprintf(generalTemplate, status.NumGuilds, len(c.Session.State.Guilds), len(status.Shards), memStats.HeapInuse/1000000),
				Inline: true,
			},
			{
				Name:   "Number of Feeds",
				Value:  fmt.Sprintf(feedsTemplate, p.Sprintf("%d\n", len(guildCounts)), p.Sprintf("%d\n", totalCounts.Total)),
				Inline: true,
			},
		},
		Thumbnail: &discordgo.MessageEmbedThumbnail{
			URL: c.Session.State.User.AvatarURL("1024"),
		},
	})

	return err
}

func init() {
	stats := Command{
		Name:        "stats",
		Description: "View bot statistics",
		Run:         statsCommand,
	}

	stats.Register()
}
