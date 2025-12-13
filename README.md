![Node.js](https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=nodedotjs&logoColor=white)
![Express.js](https://img.shields.io/badge/Express.js-000000?style=for-the-badge&logo=express&logoColor=white)
![MongoDB](https://img.shields.io/badge/MongoDB-47A248?style=for-the-badge&logo=mongodb&logoColor=white)
![Google Gemini](https://img.shields.io/badge/Google%20Gemini-8E75B2?style=for-the-badge&logo=googlebard&logoColor=white)
![React Native](https://img.shields.io/badge/React_Native-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)
![Expo](https://img.shields.io/badge/Expo-000020?style=for-the-badge&logo=expo&logoColor=white)

# Cubic Weather Project 🌤️

Welcome to the **Cubic Weather** ecosystem. This project represents a seamless fusion of precise meteorological data and generative artificial intelligence, delivering a weather experience that is not only informative but visually immersive. It consists of a high-performance **Backend API** and a polished **Mobile Application**.

---

## 📱 Mobile App

The mobile application is designed with a focus on user experience and visual elegance, customized to provide immediate value to the user.

### Key Features

- **⚡ Real-Time Weather Accuracy**:
  The app pulls the latest data including temperature, wind speed, humidity, and forecast predictions, ensuring you never leave the house unprepared.
- **🖼️ Dynamic AI Backgrounds**:
  Gone are the days of static wallpapers. The app displays unique, AI-generated cityscapes that reflect the _current_ weather conditions of your selected city—visualizing rain, snow, or clear skies in real-time.

- **🧩 Interactive Home Screen Widget**:
  Keep track of the weather without even opening the app. The fully integrated Android widget sits on your home screen, offering a quick snapshot of the weather along with the latest generated atmospheric visual.

---

## ⚙️ Backend API

The backend serves as the intelligent core of the ecosystem, managing data orchestration, image generation, and security.

### Architecture & Capabilities

- **🧠 AI Image Generation Pipeline**:
  Leveraging **Google GenAI (Nano Banana)**, the system constructs detailed prompts based on live weather parameters to generate high-quality, atmospheric city illustrations.

- **🕒 Automated Scheduling**:
  Using `node-cron`, the system intelligently schedules image updates, ensuring fresh visuals are available throughout the day without overloading the AI provider.

- **💾 Optimized Storage & Caching**:
  Generated images are efficiently stored and served statically, reducing latency for end-users and minimizing redundant API calls.

- **🔒 Robust Security**:
  All protected endpoints are secured using **JWT (JSON Web Tokens)**, ensuring that only authenticated applications and users can interact with sensitive features.

---

## 📸 Screenshots

<div align="center">
  <h3>📱 Application Interface</h3>
  <p><i>A clean, modern interface displaying detailed weather metrics.</i></p>
  <img src="./screenshots/Screenshot1.jpg" width="280" alt="Application Interface" style="border-radius: 12px; box-shadow: 0 4px 8px rgba(0,0,0,0.2);">
  
  <br><br>

  <h3>🏙️ AI City Visualization</h3>
  <p><i>An example of a dynamically generated cityscape reflecting local weather.</i></p>
  <img src="./screenshots/screenshot2.png" width="400" alt="City View" style="border-radius: 12px; box-shadow: 0 4px 8px rgba(0,0,0,0.2);">
</div>

---

