export default function showLoadingSpinner(show)
{
    let spinner = document.getElementById("loading-spinner");

    if (show)
    {
        if (!spinner)
        {
            spinner = document.createElement("div");
            spinner.id = "loading-spinner";
            spinner.style.position = "fixed";
            spinner.style.top = "0";
            spinner.style.left = "0";
            spinner.style.width = "100vw";
            spinner.style.height = "100vh";
            spinner.style.background = "rgba(0, 0, 0, 0.5)";
            spinner.style.display = "flex";
            spinner.style.justifyContent = "center";
            spinner.style.alignItems = "center";
            spinner.style.zIndex = "9999";

            const spinnerInner = document.createElement("div");
            spinnerInner.style.width = "50px";
            spinnerInner.style.height = "50px";
            spinnerInner.style.border = "5px solid rgba(255, 255, 255, 0.3)";
            spinnerInner.style.borderTop = "5px solid white";
            spinnerInner.style.borderRadius = "50%";
            spinnerInner.style.animation = "spin 1s linear infinite";

            spinner.appendChild(spinnerInner);
            document.body.appendChild(spinner);

            if (!document.getElementById("spinner-style"))
            {
                const style = document.createElement("style");
                style.id = "spinner-style";
                style.innerHTML = `
                    @keyframes spin {
                        0% { transform: rotate(0deg); }
                        100% { transform: rotate(360deg); }
                    }
                `;
                document.head.appendChild(style);
            }
        }
    }
    else
    {
        if (spinner) spinner.remove();
    }
}