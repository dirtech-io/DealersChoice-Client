import { Audio } from "expo-av";

const sounds = {
  cardSlide: require("../assets/sounds/card-slide.mp3"),
  cardFlip: require("../assets/sounds/card-flip.mp3"),
  chips: require("../assets/sounds/chips-clack.mp3"),
  check: require("../assets/sounds/check-tap.mp3"),
  alert: require("../assets/sounds/turn-alert.mp3"),
};

let loadedSounds = {};

export const loadPokerSounds = async () => {
  for (const [key, path] of Object.entries(sounds)) {
    const { sound } = await Audio.Sound.createAsync(path);
    loadedSounds[key] = sound;
  }
};

export const playSound = async (soundKey) => {
  try {
    if (loadedSounds[soundKey]) {
      await loadedSounds[soundKey].replayAsync();
    }
  } catch (error) {
    console.log("Audio play error", error);
  }
};
