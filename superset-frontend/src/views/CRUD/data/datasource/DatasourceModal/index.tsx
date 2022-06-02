import {
    t,
    SupersetTheme,
} from '@superset-ui/core';
import React, {
    FunctionComponent,
    useEffect,
    useState,
} from 'react';
import { AntdSelect } from 'src/components';
import Modal from 'src/components/Modal';
import Button from 'src/components/Button';
import withToasts from 'src/components/MessageToasts/withToasts';
import MySQLForm from './MySQLForm';
import {
    DatabaseObject,
} from 'src/views/CRUD/data/database/types';
import {
    ModalStyle,
    antDModalNoPaddingStyles,
    antDModalStyles,
    formHelperStyles,
    formStyles,
} from './styles';
import GSheetForm from './GSheetForm';
import MiniOForm from './MiniOForm';
import PostgreSQLForm from './PostgreSQLForm';
import { DatasourceObject } from '../types';
import { DEFAULT_BE_URL } from 'packages/superset-ui-core/src/connection/constants';

interface DatasourceModalProps {
    addDangerToast: (msg: string) => void;
    addSuccessToast: (msg: string) => void;
    onDatabaseAdd?: (database?: DatabaseObject) => void; // TODO: should we add a separate function for edit?
    onHide: () => void;
    show: boolean;
    databaseId: number | undefined; // If included, will go into edit mode
    dbEngine: string | undefined; // if included goto step 2 with engine already set
    isEditMode: boolean,
    connection?: DatasourceObject
}

const DatasourceModal: FunctionComponent<DatasourceModalProps> = ({
    onHide,
    show,
    connection,
    isEditMode,
}) => {
    const [connector, setConnector] = useState(connection ?? null);
    const [connectionType, setConnectionType] = useState(connection?.connector_type ?? "");
    function handleChange(value: string) {
        setConnectionType(value);
    }

    useEffect(() => {
        console.log(connector)
    }, [connector])

    const onClose = () => {
        onHide();
    };
    const renderAvailableConnector = () => (
        <div className="available">
            <h4 className="available-label">
                {isEditMode ? '' : 'Choose from a list of other datasource connector type we support:'}
            </h4>
            <div className="control-label">{t('Supported connector type')}</div>
            <AntdSelect
                className="available-select"
                onChange={handleChange}
                placeholder={t('Choose a connector type...')}
                showSearch
                defaultValue={isEditMode ? connection?.connector_type : ""}
                disabled={isEditMode}
            >
                <AntdSelect.Option value="mysql" key="mysql" >
                    MySQL
                </AntdSelect.Option>
                <AntdSelect.Option value="postgresql" key="postgresql">
                    PostgreSQL
                </AntdSelect.Option>
                <AntdSelect.Option value="minio" key="minio">
                    minIO
                </AntdSelect.Option>
                <AntdSelect.Option value="gsheets" key="gsheets">
                    Google Sheet
                </AntdSelect.Option>
                <AntdSelect.Option value="Other" key="Other">
                    {t('Other')}
                </AntdSelect.Option>
            </AntdSelect>

        </div>
    );
    const renderForm = (value: string) => {
        switch (value) {
            case "mysql":
                return <MySQLForm setConnection={setConnector} connection={connection} />
            case "gsheets":
                return <GSheetForm setConnection={setConnector} connection={connection} />
            case "minio":
                return <MiniOForm setConnection={setConnector} />
            case "postgresql":
                return <PostgreSQLForm setConnection={setConnector} connection={connection} />
            default:
                return <div> </div>
        }
    }
    const handleSave = () => {
        if (isEditMode) {
            fetch(DEFAULT_BE_URL + "/api/v1/connector/update_connection", {
                method: "POST",
                body: JSON.stringify(connector)
            }).then((res) => console.log(res.json()))
        } else {
            fetch(DEFAULT_BE_URL + "/api/v1/connector/add_connection", {
                method: "POST",
                body: JSON.stringify(connector)
            }).then((res) => console.log(res.json()))
        }
    }
    const handleTestConnection = () => {

    }
    //set modal update got data， upload component
    return (

        <Modal
            destroyOnClose
            css={(theme: SupersetTheme) => [
                antDModalNoPaddingStyles,
                antDModalStyles(theme),
                formHelperStyles(theme),
                formStyles(theme),
            ]}
            name="database"
            onHandledPrimaryAction={() => { }}
            onHide={onClose}
            footer={[
                <Button key="submit" type="primary" onClick={handleTestConnection}>
                    Test Connection
                </Button>,
                <Button key="submit" type="primary" onClick={handleSave}>
                    Save
                </Button>
            ]}
            width="500px"
            centered
            show={show}
            title={<h4>{t(isEditMode ? 'Update a datasource' : 'Add a datasource')}</h4>}

        >
            <ModalStyle>
                {renderAvailableConnector()}
                {renderForm(isEditMode ? (connection?.connector_type ?? "") : connectionType)}
            </ModalStyle>

        </Modal>

    );
};

export default withToasts(DatasourceModal);

