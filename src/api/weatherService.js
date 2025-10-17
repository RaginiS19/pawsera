export const fetchWeather = async (city) => {
  const key = process.env.REACT_APP_OPENWEATHER_API_KEY || "demo-weather-key";
  const res = await fetch(`https://api.openweathermap.org/data/2.5/weather?q=${encodeURIComponent(city)}&units=metric&appid=${key}`);
  if(!res.ok) throw new Error('Weather API error');
  return res.json();
};
