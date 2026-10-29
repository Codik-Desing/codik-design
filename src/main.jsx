import React from "react";
import { createRoot } from "react-dom/client";
import Privacy from "./Privacy";
import CookieBanner from "./CookieBanner";
import Redesign from "./Redesign";
import "./redesign.css";
import "./contact.css";

createRoot(document.getElementById("root")).render(window.location.pathname.replace(/\/$/, "") === "/privacidade"
  ? <><Privacy /><CookieBanner delay={0} /></> : <Redesign />);
