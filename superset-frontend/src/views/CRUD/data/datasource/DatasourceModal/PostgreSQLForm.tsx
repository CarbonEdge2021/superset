import React, {
    Dispatch,
    SetStateAction,
    useEffect,
    useState,
} from 'react';
import { Form, Input } from 'antd';
import { DatasourceObject } from '../types';

interface PostgreSQLFormProps {
    setConnection: Dispatch<SetStateAction<any>>,
    connection?: DatasourceObject
}

const PostgreSQLForm = (props: PostgreSQLFormProps) => {
    const [catalogId, setCatalogId] = useState(props.connection?.catalog_id ?? "");
    const [connectionUrl, setConnectionUrl] = useState(props.connection?.data.connectionUrl ?? "");
    const [connectionUser, setConnectionUser] = useState(props.connection?.data.connectionUser ?? "");
    const [connectionPassword, setConnectionPassword] = useState(props.connection?.data.connectionPassword ?? "");
    console.log(props.connection?.catalog_id ?? "")
    useEffect(() => {
        props.setConnection({
            catalog_id: catalogId,
            data: {
                connector_name: "postgresql",
                connection_url: connectionUrl,
                connection_user: connectionUser,
                connection_password: connectionPassword
            }
        })
    }, [catalogId, connectionUrl, connectionUser, connectionPassword])

    return (
        <div style={{ display: "flex", justifyContent: "center", paddingTop: "5px" }}>
            <Form
                name="basic"
                initialValues={{ remember: false }}
                autoComplete="off"
                layout="horizontal"
            >
                <Form.Item
                    label="Catalog id"
                    name="catalogId"
                    rules={[{ required: true, message: 'Please input a catalog id!' }]}
                >
                    <Input defaultValue={props.connection?.catalog_id ?? ""} onChange={(e) => { setCatalogId(e.target.value) }} />
                </Form.Item>
                <Form.Item
                    label="Connection Url"
                    name="connectionUrl"
                    rules={[{ required: true, message: 'Please input the connection url!' }]}
                >
                    <Input defaultValue={props.connection?.data.connection_url ?? ""} onChange={(e) => { setConnectionUrl(e.target.value) }} />
                </Form.Item>
                <Form.Item
                    label="Connection User"
                    name="connectionUser"
                    rules={[{ required: true, message: 'Please input the connection user!' }]}
                >
                    <Input defaultValue={props.connection?.data.connection_user ?? ""} onChange={(e) => { setConnectionUser(e.target.value) }} />
                </Form.Item>

                <Form.Item
                    label="Connection Password"
                    name="connectionPassword"
                    rules={[{ required: true, message: 'Please input your connection password!' }]}
                >
                    <Input.Password defaultValue={props.connection?.data.connection_password ?? ""} onChange={(e) => { setConnectionPassword(e.target.value) }} />
                </Form.Item>
            </Form>
        </div>
    );
}

export default PostgreSQLForm;