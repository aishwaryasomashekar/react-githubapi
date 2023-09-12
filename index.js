
const express = require('express');
const bodyParser = require('body-parser');
const cors = require('cors');
const session = require("express-session");
const axios = require("axios");


const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(bodyParser.json());
app.use(cors()); 



// Github api started here
// Enable CORS for your React app's origin
app.use(
  cors({
    origin: "http://localhost:3000", 
    credentials: true,
  })
);


// Configure session middleware
app.use(
  session({
    secret: "584dd4a87b7a54120ecc1f09d5d14add546ed00b", 
    resave: true,
    saveUninitialized: true,
  })
);

// Define your GitHub OAuth configuration here
const clientId = '787dea0261fc8914ebd0';
const clientSecret = '584dd4a87b7a54120ecc1f09d5d14add546ed00b';
const redirectUri = "http://localhost:5000/callback";

// Define your API routes here
app.get("/api/auth", (req, res) => {
  // Your authentication logic here
  res.redirect(
    `https://github.com/login/oauth/authorize?client_id=${clientId}&redirect_uri=${redirectUri}`
  );
});

app.get("/callback", async (req, res) => {
  try {
    const { code } = req.query;
    const response = await axios.post(
      "https://github.com/login/oauth/access_token",
      {
        client_id: clientId,
        client_secret: clientSecret,
        code: code,
        redirect_uri: redirectUri,
      },
      {
        headers: {
          Accept: "application/json",
        },
      }
    );
    const accessToken = response.data.access_token;

    // Store the access token in the session
    req.session.accessToken = accessToken;

    // Redirect back to the frontend without the access token in the URL
    res.redirect("http://localhost:3000"); 
  } catch (error) {
    console.error(error);

    // Handle authorization failure
    res.status(500).send("Authorization failed.");
  }
});
  

app.get("/api/user", async (req, res) => {
  // Your user data retrieval logic here
  try {
    const accessToken = req.session.accessToken;
    console.log("AccessToken :", accessToken);
    if (!accessToken) {
      res.status(401).send("Access token not found.");
      return;
    }
    // Make an authenticated request to fetch user data from GitHub API
    const response = await axios.get("https://api.github.com/user", {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });
    const userData = response.data;
    res.json(userData);
  } catch (error) {
    console.error(error);
    res.status(500).send("Failed to fetch user data.");
  }
});


app.get("/api/fetch-repo/:owner/:repo", async (req, res) => {
  const { owner, repo } = req.params;
  try {
    const accessToken = req.session.accessToken;
    if (!accessToken) {
      res.status(401).send("Access token not found.");
      return;
    }
    // Make an authenticated request to fetch repository data from GitHub API
    const repoResponse = await axios.get(
      `https://api.github.com/repos/${owner}/${repo}`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );
    const repoData = repoResponse.data;

    // Make another request to fetch the branches for the repository
    const branchesResponse = await axios.get(
      `https://api.github.com/repos/${owner}/${repo}/branches`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      }
    );

    const branchesData = branchesResponse.data;
    // Combine the repository data and branches data
    const responseData = {
      repository: repoData,
      branches: branchesData,
    };

    res.json(responseData);
  } catch (error) {
    console.error(error);
    res.status(500).send("Failed to fetch repository data.");
  }
});



app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
