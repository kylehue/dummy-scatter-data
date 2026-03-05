import { createApp } from "vue";
import "@/styles/global.css";
import App from "./app/App.vue";
import { createPinia } from "pinia";

const app = createApp(App);
const pinia = createPinia();

app.use(pinia);
app.mount("#app");
