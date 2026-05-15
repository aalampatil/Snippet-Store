import axios from "axios";
console.log("env test:", process.env.EXPO_PUBLIC_LOCAL_API_URL);

export const api = axios.create({
  baseURL: __DEV__
    ? process.env.EXPO_PUBLIC_LOCAL_API_URL
    : process.env.EXPO_PUBLIC_PRODUCTION_API_URL,
});
