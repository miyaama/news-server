const express = require("express");
const app = express();
const bodyParser = require("body-parser");
const cors = require("cors");

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

app.get("/api/comments/:id", async (req, res) => {
  const id = req.params.id;
  let count = 0;
  try {
    let newsItem = await axios({
      url: `item/${id}.json?print=pretty`,
      method: "get",
    });

    const commentsIds = newsItem.data.kids;
    if (!commentsIds || !commentsIds.length) {
      return res.status(200).json([]);
    }
    console.log("comIds", newsItem.data);
    let i = await commentsIds?.map(async (id) => {
      const result = await axios({
        url: `item/${id}.json?print=pretty`,
        method: "get",
      });
      const { by, text, time, kids } = result.data;
      // if (kids && kids?.length) {
      //   count += kids?.length;
      //   const sub = getComments(com?.data.kids);
      //   com.subs = sub;
      // }
      let comment = {
        author: by,
        content: text,
        datetime: time,
      };
      return comment;
    });

    const result = await Promise.all(i);

    res.status(200).json(result);
  } catch (err) {
    console.log(err);
    res.status(500).json({ message: err });
  }
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
