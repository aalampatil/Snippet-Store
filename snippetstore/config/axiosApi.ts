import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";
console.log("env test:", process.env.EXPO_PUBLIC_LOCAL_API_URL);

export const api = axios.create({
  baseURL: __DEV__
    ? process.env.EXPO_PUBLIC_LOCAL_API_URL
    : process.env.EXPO_PUBLIC_PRODUCTION_API_URL,
});

api.interceptors.request.use(async (config) => {
  const token = await AsyncStorage.getItem("auth_token");
  if (token) {
    config.headers = config.headers ?? {};
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});
