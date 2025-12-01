

window.parent.location.reload();
/////////////////////////////////////////////////////////

          mainLoader("./pages/home.html","index-home-container",0,undefined,"hiddenHomeIcon");
mainLoader(
    "./pages/login.html",
    "index-user-container",
    0,
    undefined,
    "showHomeIcon",true
  );

/////////////////////////////////////////////////////
  const user = JSON.parse(localStorage.getItem("loggedInUser"));

//if (Number(userSession.is_seller) >= 1)  /////////////////////////////////////////////////////////
console.log(
  "%c✔✔✔✔✔✔✔ تم التحميل ✔✔✔✔✔✔✔\n" +
  `pageUrl: ${pageUrl}\n` +
  `containerId: ${containerId}\n` +
  `reload: ${reload}`,
  "color: #0a4902ff; font-size: 12px; font-weight: bold; font-family: 'Tahoma';"
);



