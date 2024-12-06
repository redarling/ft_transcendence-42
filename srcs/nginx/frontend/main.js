// import * as Header from "./components/header.js";

// document.addEventListener("DOMContentLoaded", () => 
//     {
//         Header.loadHeader();
//     });
    
import { loadHeader } from './components/header.js'; // Adjust the path if necessary
import { loadHomePage } from './components/home.js'; // Adjust the path if necessary

document.addEventListener('DOMContentLoaded', () => 
{
    loadHeader();
    loadHomePage();

});