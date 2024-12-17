import { useState, useEffect } from "react";
import "./App.css";
import { ModifyServer, GetServers, RemoveServer } from "../wailsjs/go/main/App";
import { Button, Card, Row, Col, Modal, Form, Input, Radio, Flex, Table, Space, message } from "antd";
import { UnorderedListOutlined, PlusOutlined } from "@ant-design/icons";



function App() {
    const [showAddServer, setShowAddServer] = useState(false);
    const [showServerList, setShowServerList] = useState(false);
    const [servers, setServers] = useState([]);
    const [form] = Form.useForm();
    const columns = [
        {
            title: 'ServerIP',
            dataIndex: 'name',
            key: 'name',
            render: (_, item) => `${item.name}:${item.port}`,
        },
        {
            title: '用户',
            dataIndex: 'user',
            key: 'user',
        },
        {
            title: '密码',
            dataIndex: 'password',
            key: 'password',
        },
        {
            title: '操作',
            dataIndex: 'address',
            key: 'address',
            render: (_, record) => (
                <Space size="middle">
                    <a>复制</a>
                    <a onClick={deleteServer.bind(this, record)}>删除</a>
                </Space>
            ),
        },

    ];
    async function getServers() {
        let result = await GetServers();
        setServers(result)
        console.log(result)
    }
    useEffect(() => {
        getServers();
    }, []);

    async function showServerListModal() {
        await getServers()
        setShowServerList(true);
    }

    async function deleteServer(record) {
        Modal.confirm({
            title: '删除确认',
            content: '确定删除' + record.name + '吗？',
            okText: '确定',
            okType: 'danger',
            cancelText: '取消',
            onOk() {
                RemoveServer(record.name).then(() => {
                    message.info("删除成功")
                    getServers()
                })
            },
            onCancel() {
                console.log('Cancel');
            },
        });
    }


    function showAddServerModal() {
        setShowAddServer(true);
    }

    async function doAddServer() {
        form.validateFields().then((values) => {
            let data = form.getFieldsValue(true)
            console.log(data)
            ModifyServer(data)
            getServers().then(() => {
                message.info("添加成功")
                setShowAddServer(false)
            })
        }, (errorInfo) => {
            console.log("Failed:", errorInfo);
        }
        );
    }
    return (
        <div id="App">
            <div className="setting">
                <Button
                    icon={<UnorderedListOutlined />}
                    color="default"
                    variant="text"
                    onClick={showServerListModal}
                ></Button>
                <div>
                    <Button
                        icon={<PlusOutlined />}
                        color="default"
                        variant="text"
                        onClick={showAddServerModal}
                    ></Button>
                </div>
            </div>
            <Row style={{ paddingTop: "10px" }}>
                <Col span={22} offset={1}>
                    <Card>
                        <h3>服务器列表</h3>
                        <Flex vertical gap="middle">
                            <Radio.Group
                                block
                                defaultValue="Apple"
                                optionType="button"
                                buttonStyle="solid"
                            >
                                {servers.map((option) => {return <Radio.Button key={option.name} value={option}>{option.name}</Radio.Button>})}
                            </Radio.Group>
                        </Flex>
                        <h3>命令列表</h3>
                    </Card>
                </Col>
            </Row>
            <Modal title="服务器列表" open={showServerList} onCancel={() => setShowServerList(false)} width={'60%'}>
                <Table
                    columns={columns}
                    rowKey={(record) => record.ip}
                    dataSource={servers}
                    pagination={false}
                    size="small"
                />
            </Modal>
            <Modal
                title="添加服务器"
                open={showAddServer}
                onCancel={() => setShowAddServer(false)}
                onOk={doAddServer}
            >
                <Form
                    name="basic"
                    form={form}
                    labelCol={{ span: 5 }}
                    wrapperCol={{ span: 16 }}
                    initialValues={{ name: '', port: '22', user: 'root', password: '1234567' }}
                    style={{ marginTop: '30px' }}
                    autoComplete="off"
                >
                    <Form.Item label="ServerIP" name="name" rules={[{ required: true, message: "Please input your name!" }]}>
                        <Input />
                    </Form.Item>
                    <Form.Item label="Port" name="port" rules={[{ required: true, message: "Please input your port!" }]}>
                        <Input />
                    </Form.Item>
                    <Form.Item label="User" name="user" rules={[{ required: true, message: "Please input your username!" }]}>
                        <Input />
                    </Form.Item>
                    <Form.Item label="Password" name="password" rules={[{ required: true, message: "Please input your password!" }]}>
                        <Input.Password />
                    </Form.Item>
                </Form>
            </Modal>
        </div>
    );
}

export default App;
