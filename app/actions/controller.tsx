import { createController } from "remix/router";

import { routes } from "../routes.ts";
import { Document } from "../ui/document.tsx";

export default createController(routes, {
  actions: {
    home(context) {
      return context.render(
        <Document>
          <main>
            <h1>Niapya</h1>
            <p>Personal Portfolio</p>
          </main>
        </Document>,
      );
    },
  },
});
