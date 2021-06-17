import { writable } from "svelte/store";

const storedHistory = JSON.parse(localStorage.getItem("history")||"[]");
export const resultHistory = writable(storedHistory);

resultHistory.subscribe(value => {
	console.log(value)
    localStorage.setItem("history", JSON.stringify(value));
});