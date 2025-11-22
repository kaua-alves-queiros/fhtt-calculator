# 🌐 FHTT Calculator (Fiber-to-the-x Network Planner)

![Project Status](https://img.shields.io/badge/status-active-brightgreen)
![License](https://img.shields.io/badge/license-MIT-blue)
![Next.js](https://img.shields.io/badge/Next.js-black?style=flat&logo=next.js&logoColor=white)

> A visual, interactive tool for planning, simulating, and calculating power budgets in GPON/EPON optical networks.

**🔗 Live Demo:** [Access the Online Calculator (Vercel)](https://fhtt-calculator.vercel.app/)

---

## 📸 Preview

<div align="center">
  <img src="screenshots/1.png" alt="Dark Mode" width="45%" />
</div>

## 📖 About the Project

The **FHTT Calculator** is a web application designed to assist Internet Service Providers (ISPs), network designers, and telecommunications technicians in designing optical network topologies. Its main objective is to simulate real-world signal attenuation scenarios, allowing users to predict whether the power reaching the client's home (ONU) is within acceptable standards, helping to avoid physical errors during network construction.

The tool allows users to drag components onto an infinite canvas, connect them logically, and obtain automatic loss calculations based on technical standards and optical physics.

## ✨ Key Features

* **📡 Signal Source (PON):** Flexible configuration of the OLT output power (in dBm).
* **🔀 Balanced Splitters:** Simulation of optical splitters from **1:2 to 1:128** with standardized insertion losses.
* **⚡ Unbalanced Splitters:** Full support for bus topology scenarios with varied ratios (1/99, 2/98, 5/95, etc.), calculating distinct losses for *Thru* and *Tap* ports.
* **📏 Distance Calculation:** Simulation of fiber optic cable loss per meter (configurable attenuation per km).
* **📉 Attenuators:** Manual attenuators for fine-tuning the network.
* **🏠 End Client (ONU):** Automatic and instant reading of the reception signal (Rx) at the end of the network.
* **💾 Data Persistence:** Robust **JSON Import and Export** system, allowing users to save complex topologies, share them with the team, and resume work later.

## 🧠 Technical Challenges & Engineering

This project went beyond a simple calculation form. Its construction involved complex Software Engineering challenges in Frontend and Data Structures:

### 1. Drag-and-Drop Architecture & State Management
Implementing a fluid interface where the user can freely position components on an infinite canvas required advanced use of graph libraries (React Flow). The challenge was to maintain high performance (60fps) even with dozens of rendered components and connections being redrawn in real-time.

### 2. Interconnection Logic & Recursive Propagation
The core complexity of the system lies in the **reactivity of physical calculations**. Unlike a static spreadsheet, the FHTT Calculator functions as a dynamic directed graph:
* **Node Awareness:** Each component needs to "know" who its parent (input) is and who its children (outputs) are.
* **Cascading Propagation:** Changing the power at the Source (PON) or increasing a cable length at the beginning of the network triggers a recursive algorithm that recalculates the loss for all subsequently connected components.
* **Precision:** This ensures that the dBm value at the end (ONU) is mathematically precise and instantaneous, considering the sum of all losses along the path.

## 🛠️ Technologies Used

* **Framework:** [Next.js](https://nextjs.org/) (React)
* **Node Visualization:** [React Flow](https://reactflow.dev/)
* **Styling:** Tailwind CSS
* **Icons:** Lucide React
* **Deploy:** Vercel

## 🚀 How to Run Locally

This is a **Next.js** project. To run it on your machine for study or improvements, follow the steps below:

### Prerequisites
* **Node.js** (Version 18 or higher recommended)
* **npm**, **yarn**, or **pnpm**

### Installation and Execution

1. **Clone the repository:**
   ```bash
   git clone [https://github.com/kaua-alves-queiros/fhtt-calculator.git](https://github.com/kaua-alves-queiros/fhtt-calculator.git)
   ```

2. **Navigate to the project folder:**
   ```bash
   cd fhtt-calculator
   ```

3. **Install dependencies:**
   ```bash
   npm install
   # or if you prefer yarn:
   yarn install
   ```

4. **Start the development server:**
   ```bash
   npm run dev
   # or
   yarn dev
   ```

5. **Access the application:**
   Open your browser and visit [http://localhost:3000](http://localhost:3000).
   The application features *Hot Reload*, so any code changes will be reflected automatically.

## 🤝 Contribution

Contributions are very welcome! If you have ideas for new components (e.g., APC/UPC connectors, fusion splice losses) or improvements to the calculation logic:

1.  Fork the project.
2.  Create a Branch for your Feature (`git checkout -b feature/NewFeature`).
3.  Commit your changes (`git commit -m 'Add: New Feature X'`).
4.  Push to the Branch (`git push origin feature/NewFeature`).
5.  Open a Pull Request.

## 📝 License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for more details.

---

Developed with 💙 by [Kauã Alves Queirós](https://github.com/kaua-alves-queiros)