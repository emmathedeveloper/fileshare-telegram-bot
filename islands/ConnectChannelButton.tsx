import { IS_BROWSER } from "fresh/runtime";
import { FaPencilAlt } from "react-icons/fa";

const ConnectChannelButton = () => {

  if(!IS_BROWSER) return

  return (
    <button
      onClick={() => (document.getElementById("my_modal_1") as HTMLDialogElement)
        .showModal()}
      class="btn btn-primary"
    >
      <FaPencilAlt size={20} />
      EDIT CHANNELS
    </button>
  );
};


export default ConnectChannelButton