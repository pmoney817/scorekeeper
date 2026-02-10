export const pickleballAffirmations = [
  "I dink with purpose and precision.",
  "My kitchen game is unstoppable today.",
  "I am patient at the net and powerful from the baseline.",
  "Every serve I make is an opportunity for greatness.",
  "I stay calm in the third-shot drop zone.",
  "My paddle is an extension of my positive energy.",
  "I embrace the dink battle with grace and strategy.",
  "Today, I play with joy and leave with victories.",
  "My footwork flows like water on the court.",
  "I am the master of the soft game.",
  "Every rally is a chance to grow stronger.",
  "I trust my backhand like I trust myself.",
  "The kitchen line is my home, and I own it.",
  "I celebrate every point, win or learn.",
  "My reflexes are sharp, my spirit is sharper.",
  "I bring positive energy to every game I play.",
  "Today I will out-patience my opponents.",
  "My lobs are majestic, my drops are deadly.",
  "I am grateful for every moment on the court.",
  "I play pickleball, therefore I am happy.",
  "My partner and I are in perfect sync today.",
  "I reset with confidence and attack with intention.",
  "The ball goes where my focus leads it.",
  "I am a student of the game, always learning.",
  "My erne game is absolutely legendary.",
  "I stay low, stay ready, and stay positive.",
  "Every miss is just practice for the next hit.",
  "I dominate the transition zone with ease.",
  "My spin serves keep opponents guessing.",
  "I am exactly where I need to be on the court.",
];

export const getRandomAffirmation = () => {
  const randomIndex = Math.floor(Math.random() * pickleballAffirmations.length);
  return pickleballAffirmations[randomIndex];
};

export const getDailyAffirmation = () => {
  const today = new Date();
  const dayOfYear = Math.floor(
    (today.getTime() - new Date(today.getFullYear(), 0, 0).getTime()) /
      (1000 * 60 * 60 * 24)
  );
  const index = dayOfYear % pickleballAffirmations.length;
  return pickleballAffirmations[index];
};
