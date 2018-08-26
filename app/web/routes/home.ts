import { app, viewContext } from "./support";

app.get("/", (request, response) => {
  response.render("index", viewContext({ title: "Rebate Management" }));
});

export default app;
