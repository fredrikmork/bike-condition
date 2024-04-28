import { NextApiRequest, NextApiResponse } from "next";
// import fetch from 'isomorphic-fetch';

const STRAVA_CLIENT_ID = process.env.STRAVA_CLIENT_ID;
const STRAVA_CLIENT_SECRET = process.env.STRAVA_CLIENT_SECRET;
const STRAVA_REFRESH_TOKEN = process.env.STRAVA_REFRESH_TOKEN;
const ATHLETE_ID = 2923172;
const GEAR_ID = "b2386966"
const TOKEN_ENDPOINT = "https://www.strava.com/oauth/token";
const STRAVA_BASE_URL = "https://www.strava.com/api/v3/";
export const ATHELETE_ENDPOINT = `${STRAVA_BASE_URL}athletes/${ATHLETE_ID}`;
export const GEAR_ENDPOINT = `${STRAVA_BASE_URL}gear/${GEAR_ID}`;
const AUTHORIZATION_CODE = process.env.AUTHORIZATION_CODE;

const getAccessToken = async () => {
  const body = JSON.stringify({
    client_id: STRAVA_CLIENT_ID,
    client_secret: STRAVA_CLIENT_SECRET,
    // refresh_token: STRAVA_REFRESH_TOKEN,
    code: AUTHORIZATION_CODE, //TODO - get this from the user
    grant_type: "refresh_token",
  });
  console.log("trying to fetch");

  try {
    const response = await fetch(TOKEN_ENDPOINT, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      },
      body: body,
    });
    const data = await response.json();
  
    return data.access_token;
  } catch (error) {
    console.log(error);
  }

};

async function getStravaType(url: string/*req: NextApiRequest, res: NextApiResponse*/) {
  // const accessToken = await getAccessToken();
  try {
    const response = await fetch(`${url}`, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${process.env.ACCESS_TOKEN}`,
        ContentType: "application/json",
      },
    });
  
    const data = await response.json();    
    return data;
  } catch (error) {
    console.log(error);
  }
  // res.status(200).json(data);
}


export default getStravaType;
