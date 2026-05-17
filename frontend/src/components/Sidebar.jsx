import { routes } from "../data/routes";

function Sidebar() {
  return (
    <div className="sidebar">

      <h2>Transportasi</h2>

      {routes.map((route) => (
        <div className="route-card" key={route.id}>

          <div
            className="route-color"
            style={{ background: route.color }}
          ></div>

          <p>{route.name}</p>

        </div>
      ))}

    </div>
  );
}

export default Sidebar;