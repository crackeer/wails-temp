import { useState, useEffect } from 'react';
import './App.css';
import { Greet } from "../wailsjs/go/main/App";
import { Button, Card, Row, Col, Modal, Form, Input, Radio } from 'antd';
import { SettingOutlined } from '@ant-design/icons';
function App() {
    const [show, setShow] = useState(false);
    const updateName = (e) => setName(e.target.value);
    const updateResultText = (result) => setResultText(result);
    const [form] = Form.useForm();
    const [formLayout, setFormLayout] = useState('horizontal');
    useEffect(() => {

    }, [])

    function greet() {
        Greet(name).then(updateResultText);
    }
    function showSetting() {

        setShow(true);
    }

    function onFormLayoutChange() {
        setFormLayout(formLayout);
    }

    return (
        <div id="App">
            <div className='setting'>
                <Button icon={<SettingOutlined />} color="default" variant="text" onClick={setShow}></Button>
            </div>
            <Modal
                title="设置"
                open={show}
                onCancel={() => setShow(false)}

            >
                <p>Some contents...</p>
                <p>Some contents...</p>
                <p>Some contents...</p>
            </Modal>
            <Row style={{ paddingTop: "100px" }}>
                <Col span={20} offset={2}>
                    <Card title="Card title">
                        <Form
                            form={form}
                            initialValues={{ layout: formLayout }}
                            onValuesChange={onFormLayoutChange}
                            style={{ maxWidth: formLayout === 'inline' ? 'none' : 600 }}
                        >
                            <Form.Item label="Form Layout" name="layout">
                                <Radio.Group value={formLayout}>
                                    <Radio.Button value="horizontal">Horizontal</Radio.Button>
                                    <Radio.Button value="vertical">Vertical</Radio.Button>
                                    <Radio.Button value="inline">Inline</Radio.Button>
                                </Radio.Group>
                            </Form.Item>
                            <Form.Item label="Field A">
                                <Input placeholder="input placeholder" />
                            </Form.Item>
                            <Form.Item label="Field B">
                                <Input placeholder="input placeholder" />
                            </Form.Item>
                            <Form.Item>
                                <Button type="primary">Submit</Button>
                            </Form.Item>
                        </Form>
                    </Card>
                </Col>
            </Row>

        </div>
    )
}

export default App
