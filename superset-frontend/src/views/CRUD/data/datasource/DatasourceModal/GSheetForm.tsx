import React, {
    Dispatch,
    SetStateAction,
    useEffect,
    useState,
} from 'react';
import { Button, Form, Input, Upload } from 'antd';
import { DatasourceObject } from '../types';
import { UploadOutlined } from '@ant-design/icons';


interface GSheetFormProps {
    setConnection: Dispatch<SetStateAction<any>>,
    connection?: DatasourceObject
}

const GSheetForm = (props: GSheetFormProps) => {
    const [catalogId, setCatalogId] = useState(props.connection?.catalog_id ?? "");
    const [credentials, setCredentials] = useState(props.connection?.data.credentials ?? "");
    const [metadataSheetId, setMetadataSheetId] = useState(props.connection?.data.metadataSheetId ?? "");

    useEffect(() => {
        props.setConnection({
            catalog_id: catalogId,
            connector_type: "gsheets",
            data: {
                credentials_path: credentials,
                metadata_sheet_id: metadataSheetId
            }
        })
    }, [catalogId, credentials, metadataSheetId])



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
                    label="Metadata Sheet Id"
                    name="metadataSheetId"
                    rules={[{ required: true, message: 'Please input the metadata sheet id!' }]}
                >
                    <Input value={props.connection?.data.metadata_sheet_id ?? ""} onChange={(e) => { setMetadataSheetId(e.target.value) }} />
                </Form.Item>

                <Form.Item
                    label="Credentials File"
                    name="credentialsfile"
                    rules={[{ required: true, message: 'Please input the metadata sheet id!' }]}
                >
                    <Upload
                        name='file'
                        accept='.json'
                        showUploadList={false}
                        beforeUpload={(file) => {
                            const reader = new FileReader();
                            reader.onload = e => {
                                setCredentials(e.target.result);
                            };
                            reader.readAsText(file);
                            return false;
                        }}>
                        <Button icon={<UploadOutlined />}>Upload</Button>
                    </Upload>
                </Form.Item>

                <Input.TextArea rows={8} value={props.connection?.data.credentials ?? credentials} disabled />
            </Form>
        </div >
    );
}

export default GSheetForm;