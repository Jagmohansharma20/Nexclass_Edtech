import Host from "../RolePage/Host";
import User from "../RolePage/User";
import { useParams, useLocation } from "react-router-dom";

function ClassRoom() {
  const { roomId } = useParams();
  const location = useLocation();

  const role = location.state?.role;
  const name = location.state?.name;
  return (
    <div>
      <div>

        {role === "Host" && (
          <Host roomId={roomId} name={name} />
        )}

        {role === "User" && (
          <User roomId={roomId}  name={name} />
        )}

      </div>
    </div>
  )
}

export default ClassRoom