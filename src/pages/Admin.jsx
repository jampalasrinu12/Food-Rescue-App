import DonationList from "../components/DonationList";

function Admin() {
  return (
    <div style={{ padding: "20px" }}>

      <h2 style={{ marginBottom: "20px" }}>
        🛠 Admin Dashboard
      </h2>

      <DonationList />

    </div>
  );
}

export default Admin;