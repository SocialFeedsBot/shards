package api

import (
	"bytes"
	"encoding/json"
	"errors"
	"fmt"
	"io"
	"net/http"
	"os"
	"sync"
	"time"

	"github.com/sirupsen/logrus"
)

var (
	ErrUnauthorized   = errors.New("401 Unauthorized")
	ErrNotFound       = errors.New("404 Not Found")
	ErrRateLimited    = errors.New("429 Rate Limited")
	ErrResponseNotSet = errors.New("the response value is nil")

	DefaultAPI = API{
		Client: &http.Client{
			Timeout: 30 * time.Second,
		},
	}
)

type API struct {
	Client *http.Client
}

type Response struct {
	HTTP  *http.Response
	Error error
}

// Payload is a struct of the API response
type Payload struct {
	Feeds     []Feed `json:"feeds"`
	Page      int    `json:"page"`
	Pages     int    `json:"pages"`
	FeedCount int    `json:"feedCount"`
}

type Feed struct {
	Type    string      `json:"type"`
	URL     string      `json:"url"`
	GuildID string      `json:"guildID"`
	Webhook FeedWebhook `json:"webhook"`
	Options FeedOptions `json:"options"`
	Display FeedDisplay `json:"display"`
}

type FeedWebhook struct {
	ID    string `json:"id"`
	Token string `json:"token"`
}

type FeedOptions struct {
	FetchReplies       bool `json:"replies"`
	ExcludeDescription bool `json:"excludeDesc"`
}

type FeedDisplay struct {
	Title string `json:"title"`
	Icon  string `json:"icon"`
}

type FeedCountResponse struct {
	RSS        int `json:"rss"`
	YouTube    int `json:"youtube"`
	Reddit     int `json:"reddit"`
	Twitter    int `json:"twitter"`
	Twitch     int `json:"twitch"`
	StatusPage int `json:"statuspage"`
	Total      int `json:"feedCount"`
}

func (api *API) Request(method, path string, payload []byte) *Response {
	req, err := http.NewRequest(method, os.Getenv("API_URL")+path, bytes.NewBuffer(payload))
	if err != nil {
		return &Response{nil, err}
	}

	req.Header.Add("Authorization", os.Getenv("API_AUTH"))

	response, err := api.Client.Do(req)
	if err != nil {
		return &Response{nil, err}
	}

	if response.StatusCode == 401 {
		return &Response{response, ErrUnauthorized}
	}
	if response.StatusCode == 404 {
		return &Response{response, ErrNotFound}
	}
	if response.StatusCode == 429 {
		return &Response{response, ErrRateLimited}
	}

	return &Response{response, err}
}

func (response *Response) GetBody() ([]byte, error) {
	if response.Error != nil {
		return nil, response.Error
	}

	body, err := io.ReadAll(response.HTTP.Body)
	if err != nil {
		return nil, err
	}
	response.HTTP.Body.Close()

	return body, err
}

func (response *Response) CheckResponse() error {
	if response.HTTP != nil {
		return nil
	}

	return ErrResponseNotSet
}

// API METHODS
func (api *API) GetFeeds() ([]Feed, error) {
	var list []Feed
	var pages int
	var errors int
	page := 1

	data, err := api.Request("GET", fmt.Sprintf("%v?page=%v", "/feeds", page), nil).GetBody()
	if err != nil {
		return []Feed{}, err
	}

	var payload Payload
	err = json.Unmarshal(data, &payload)
	if err != nil {
		return []Feed{}, err
	}

	pages = payload.Pages
	list = append(list, payload.Feeds...)

	lock := sync.RWMutex{}
	wg := sync.WaitGroup{}
	for page <= pages {
		page++
		wg.Add(1)
		go func(page int) {
			data, err := api.Request("GET", fmt.Sprintf("%v?page=%v", "/feeds", page), nil).GetBody()
			if err != nil {
				logrus.Errorln(err)
			}

			var payload Payload
			err = json.Unmarshal(data, &payload)
			if err != nil {
				errors++
				logrus.Tracef("error with page %v: %v", page, err)
			}

			lock.Lock()
			list = append(list, payload.Feeds...)
			lock.Unlock()
			wg.Done()
		}(page)
	}
	wg.Wait()

	return list, nil
}

func (api *API) GetGuildFeeds(guildID string) ([]Feed, error) {
	var list []Feed
	var pages int
	var errors int
	page := 1

	data, err := api.Request("GET", fmt.Sprintf("/feeds/%v?page=%v", guildID, page), nil).GetBody()
	if err != nil {
		return []Feed{}, err
	}

	var payload Payload
	err = json.Unmarshal(data, &payload)
	if err != nil {
		return []Feed{}, err
	}

	pages = payload.Pages
	list = append(list, payload.Feeds...)

	lock := sync.RWMutex{}
	wg := sync.WaitGroup{}
	for page <= pages {
		page++
		wg.Add(1)
		go func(page int) {
			data, err := api.Request("GET", fmt.Sprintf("/feeds/%v?page=%v", guildID, page), nil).GetBody()
			if err != nil {
				logrus.Errorln(err)
			}

			var payload Payload
			err = json.Unmarshal(data, &payload)
			if err != nil {
				errors++
				logrus.Tracef("error with page %v: %v", page, err)
			}

			lock.Lock()
			list = append(list, payload.Feeds...)
			lock.Unlock()
			wg.Done()
		}(page)
	}
	wg.Wait()

	return list, nil
}

func (api *API) GetFeedCounts() (FeedCountResponse, error) {
	data, err := api.Request("GET", "/feeds/counts", nil).GetBody()
	if err != nil {
		return FeedCountResponse{}, err
	}

	var payload FeedCountResponse
	err = json.Unmarshal(data, &payload)
	if err != nil {
		return FeedCountResponse{}, err
	}

	return payload, nil
}
