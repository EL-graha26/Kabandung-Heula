export default function FloatingMenu() {

  const routes = [
    {
      name: "Trans Metro Bandung",
      color: "blue",
    },
    {
      name: "Angkot",
      color: "green",
    },
    {
      name: "DAMRI",
      color: "orange",
    },
  ];

  return (
    <div className="floating-menu">

      <h2 className="menu-title">
        Rute Transportasi
      </h2>

      <div className="route-list">

        {routes.map((route, index) => (
          <div className="route-item" key={index}>

            <div className={`route-dot ${route.color}`}></div>

            <p>{route.name}</p>

          </div>
        ))}

      </div>

    </div>
  );
}