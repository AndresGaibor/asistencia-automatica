import puppeteer from "puppeteer";
import dotenv from "dotenv";
dotenv.config();

// variables de entorno
const url_asistencia =
  process.env.URL_ASISTENCIA ||
  "https://elearning.espoch.edu.ec/mod/attendance/view.php?id=19805";
const user = process.env.CORREO;
const password = process.env.CLAVE;

if (!user || !password) {
  console.log("ERROR\nNo se ha configurado el correo o la clave\n");
  console.log(
    'renombre el archivo ".env.example" a ".env" y configure las variables de entorno'
  );
  process.exit();
}

(async () => {
  // Inicia el navegador
  const browser = await puppeteer.launch({ headless: false });
  const page = await browser.newPage();
  await page.setRequestInterception(true);

  // Bloquea las peticiones de imagenes y fuentes para que la pagina cargue mas rapido
  noCargarImagenes(page);

  // Ingresa a la pagina de asistencia y espera hasta que se carge la pagina
  await page.goto(url_asistencia, { waitUntil: "domcontentloaded" });

  // has click en el boton de ingreso con correo institucional
  await page.click('a[title="Institucional"]');

  // esperamos hasta que aparezca el input de correo y escribimos el correo
  await page.waitForSelector('[type="email"]');
  await page.type('[type="email"]', user);

  // le damos a siguiente
  await page.click('[type="submit"]');
  await page.waitForNavigation({ waitUntil: "networkidle0" });

  // esperamos hasta que aparezca el input de clave y escribimos la clave
  await page.waitForSelector('[type="password"]');
  await page.type('[type="password"]', password);

  // le damos a siguiente
  await page.click('[type="submit"]');
  await new Promise((r) => setTimeout(r, 1000));

  // le damos a Si queremos recordar clave
  await page.click('[type="submit"]');

  // La asistencia esta dentro de una tabla, esperamos hasta que carge la tabla
  await page.waitForSelector("table");
  const tablaAsistencias = await page.$("table");

  // buscamos un enlace clickeable dentro de la tabla y le damos click
  const enlace = await tablaAsistencias.$("a");
  if (enlace) {
    await enlace.click();
  } else {
    console.log("No hay enlace de asistencia");
  }

  setTimeout(() => {
    browser.close();
  }, 60000);
})();


function noCargarImagenes(page) {
  page.on("request", (request) => {
    if (
      request.resourceType() === "image" ||
      request.resourceType() === "font"
    ) {
      request.abort();
    } else {
      request.continue();
    }
  });
}