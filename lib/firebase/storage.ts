import { getStorage } from "firebase/storage"
import { getApp } from "firebase/app"
import "./config" // Ensure the app is correctly initialized before taking storage

export const storage = getStorage(getApp())
