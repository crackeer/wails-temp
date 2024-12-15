import {useReducer, useState} from 'react';
import './App.css';
import {Greet} from "../wailsjs/go/main/App";
import { Button, DatePicker, Modal } from 'antd';
import { SettingOutlined } from '@ant-design/icons';
function App() {
    const [show, setShow] = useState(true);
    const updateName = (e) => setName(e.target.value);
    const updateResultText = (result) => setResultText(result);

    function greet() {
        Greet(name).then(updateResultText);
    }

    return (
        <div id="App">
            <div className='setting'>
                <Button icon={<SettingOutlined />}  color="default" variant="text" onClick={setShow}></Button>
            </div>
            <Modal
                title="Basic Modal"
                open={show}
                footer="Footer"
            >
                <p>Some contents...</p>
                <p>Some contents...</p>
                <p>Some contents...</p>
            </Modal>
            <DatePicker />
        </div>
    )
}

export default App
