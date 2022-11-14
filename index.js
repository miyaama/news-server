const express = require("express");
const app = express();
const bodyParser = require("body-parser");
const cors = require("cors");
const moment = require("moment");

const axios = require("axios").create({
  baseURL: "https://hacker-news.firebaseio.com/v0/",
});

const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.get("/api/get", async (req, res) => {
  try {
    const response = await axios({
      url: "newstories.json?print=pretty",
      method: "get",
    });

    let data = await response.data.slice(0, 100).map(async (d) => {
      let newsItem = await axios({
        url: `item/${d}.json?print=pretty`,
        method: "get",
      });
      return newsItem.data;
    });
    const result = await Promise.all(data);

    res.status(200).json(result);
  } catch (err) {
    res.status(500).json({ message: err });
  }
});

app.post("/api/comments", async (req, res) => {
  const ids = req.body.ids;

  try {
    if (!ids?.length) {
      return res.status(200).json([]);
    }
    let count = ids.length;

    const getComments = async (ids) => {
      const result = ids.map(async (id) => {
        const result = await axios({
          url: `item/${id}.json?print=pretty`,
          method: "get",
        });

        const { by, text, time, deleted, kids, id: commentId } = result.data;

        let comment = {
          id: commentId,
          author: by,
          content: text,
          deleted,
          datetime: moment(time * 1000).fromNow(),
          avatar: `https://joeschmoe.io/api/v1/${id}`,
          subs: [],
        };

        if (kids?.length) {
          count += kids?.length;
          const sub = await getComments(kids);
          comment.subs = sub;
        }

        return comment;
      });
      return Promise.all(result);
    };

    let result = await getComments(ids);

    res.status(200).json(result);
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: err });
  }
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
