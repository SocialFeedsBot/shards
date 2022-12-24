package health

import (
	"bufio"
	"bytes"
	"fmt"
	"os"
	"runtime"
	"time"

	"github.com/SocialFeedsBot/shards/internal/shardmanager"
)

var StartTime = time.Now()

// Health is the structure the gateway expects when requesting data about the process's usage
type Health struct {
	Uptime time.Duration               `json:"uptime"` // Milliseconds
	Memory uint64                      `json:"memory"` // This won't work on my laptop :D
	ID     float64                     `json:"id"`
	Guilds int                         `json:"guilds"`
	Shards []*shardmanager.ShardStatus `json:"shards"`
}

func ByteCountSI(b uint64) string {
	const unit = 1000
	if b < unit {
		return fmt.Sprintf("%d B", b)
	}
	div, exp := int64(unit), 0
	for n := b / unit; n >= unit; n /= unit {
		div *= unit
		exp++
	}
	return fmt.Sprintf("%.1f %cB",
		float64(b)/float64(div), "kMGTPE"[exp])
}

func GetMemory() (uint64, error) {
	runtime.GC()
	f, err := os.Open(fmt.Sprintf("/proc/%d/smaps", os.Getpid()))
	if err != nil {
		return 0, err
	}
	defer f.Close()

	res := uint64(0)
	pfx := []byte("Pss:")
	r := bufio.NewScanner(f)
	for r.Scan() {
		line := r.Bytes()
		if bytes.HasPrefix(line, pfx) {
			var size uint64
			_, err := fmt.Sscanf(string(line[4:]), "%d", &size)
			if err != nil {
				return 0, err
			}
			res += size
		}
	}
	if err := r.Err(); err != nil {
		return 0, err
	}

	return res, nil
}

// GetUptime returns process uptime in milliseconds
func GetUptime() time.Duration {
	return time.Since(StartTime) / time.Millisecond
}

// GetShardsStatus updates the current health struct with shard data.
func (health *Health) AddShardStatuses(manager *shardmanager.Manager) {
	status := manager.GetFullStatus()
	health.Shards = status.Shards
	health.Guilds = status.NumGuilds
}
