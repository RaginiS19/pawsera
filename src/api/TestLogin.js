// src/TestLogin.js
import React from "react";
import { login } from "./login"; // your existing login.js

export default function TestLogin() {
  const handleLogin = async (user) => {
    let email, password;
    if (user === "Sean") {
      email = "sean@test.com";
      password = "password1";
    } else if (user === "Ragini") {
      email = "ragini@test.com";
      password = "password2";
    } else if (user === "Bernie") {
      email = "bernie@test.com";
      password = "password3";
    }

    const userData = await login(email, password);
    console.log(userData); // should show name & role from Firestore
    alert(`Logged in as ${userData?.name} (${userData?.role})`);
  };

  return (
    <div style={{ padding: "2rem" }}>
      <h1>Test Firebase Login</h1>
      <button onClick={() => handleLogin("Sean")}>Login as Sean (Vet)</button>
      <button onClick={() => handleLogin("Ragini")}>Login as Ragini (Admin)</button>
      <button onClick={() => handleLogin("Bernie")}>Login as Bernie (Pet Owner)</button>
    </div>
  );
}
