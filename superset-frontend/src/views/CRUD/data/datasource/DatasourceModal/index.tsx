import {
    t,
    SupersetTheme,
    FeatureFlag,
    isFeatureEnabled,
} from '@superset-ui/core';
import React, {
    FunctionComponent,
    useEffect,
    useRef,
    useState,
    useReducer,
    Reducer,
} from 'react';
import { UploadChangeParam, UploadFile } from 'antd/lib/upload/interface';
import Tabs from 'src/components/Tabs';
import { AntdSelect, Upload } from 'src/components';
import Alert from 'src/components/Alert';
import Modal from 'src/components/Modal';
import Button from 'src/components/Button';
import IconButton from 'src/components/IconButton';
import InfoTooltip from 'src/components/InfoTooltip';
import withToasts from 'src/components/MessageToasts/withToasts';
import ValidatedInput from 'src/components/Form/LabeledErrorBoundInput';
import {
    testDatabaseConnection,
    useSingleViewResource,
    useAvailableDatabases,
    useDatabaseValidation,
    getDatabaseImages,
    getConnectionAlert,
    useImportResource,
} from 'src/views/CRUD/hooks';
import { useCommonConf } from 'src/views/CRUD/data/database/state';
import {
    DatabaseObject,
    DatabaseForm,
    CONFIGURATION_METHOD,
    CatalogObject,
} from 'src/views/CRUD/data/database/types';
import Loading from 'src/components/Loading';
import {
    ModalStyle,
    antDModalNoPaddingStyles,
    antDModalStyles,
    antDTabsStyles,
    buttonLinkStyles,
    importDbButtonLinkStyles,
    alchemyButtonLinkStyles,
    TabHeader,
    formHelperStyles,
    formStyles,
    StyledAlignment,
    infoTooltip,
    StyledFooterButton,
    StyledStickyHeader,
    formScrollableStyles,
    StyledUploadWrapper,
} from './styles';
import ModalHeader, { DOCUMENTATION_LINK } from './ModalHeader';

const engineSpecificAlertMapping = {
    gsheets: {
        message: 'Why do I need to create a database?',
        description:
            'To begin using your Google Sheets, you need to create a database first. ' +
            'Databases are used as a way to identify ' +
            'your data so that it can be queried and visualized. This ' +
            'database will hold all of your individual Google Sheets ' +
            'you choose to connect here.',
    },
};

const googleSheetConnectionEngine = 'gsheets';

interface DatasourceModalProps {
    addDangerToast: (msg: string) => void;
    addSuccessToast: (msg: string) => void;
    onDatabaseAdd?: (database?: DatabaseObject) => void; // TODO: should we add a separate function for edit?
    onHide: () => void;
    show: boolean;
    databaseId: number | undefined; // If included, will go into edit mode
    dbEngine: string | undefined; // if included goto step 2 with engine already set
}

enum ActionType {
    configMethodChange,
    dbSelected,
    editorChange,
    fetched,
    inputChange,
    parametersChange,
    reset,
    textChange,
    extraInputChange,
    extraEditorChange,
    addTableCatalogSheet,
    removeTableCatalogSheet,
    queryChange,
}

interface DBReducerPayloadType {
    target?: string;
    name: string;
    json?: {};
    type?: string;
    checked?: boolean;
    value?: string;
}

type DBReducerActionType =
    | {
        type:
        | ActionType.extraEditorChange
        | ActionType.extraInputChange
        | ActionType.textChange
        | ActionType.queryChange
        | ActionType.inputChange
        | ActionType.editorChange
        | ActionType.parametersChange;
        payload: DBReducerPayloadType;
    }
    | {
        type: ActionType.fetched;
        payload: Partial<DatabaseObject>;
    }
    | {
        type: ActionType.dbSelected;
        payload: {
            database_name?: string;
            engine?: string;
            configuration_method: CONFIGURATION_METHOD;
        };
    }
    | {
        type: ActionType.reset | ActionType.addTableCatalogSheet;
    }
    | {
        type: ActionType.removeTableCatalogSheet;
        payload: {
            indexToDelete: number;
        };
    }
    | {
        type: ActionType.configMethodChange;
        payload: {
            database_name?: string;
            engine?: string;
            configuration_method: CONFIGURATION_METHOD;
        };
    };

function dbReducer(
    state: Partial<DatabaseObject> | null,
    action: DBReducerActionType,
): Partial<DatabaseObject> | null {
    const trimmedState = {
        ...(state || {}),
    };
    let query = {};
    let query_input = '';
    let deserializeExtraJSON = { allows_virtual_table_explore: true };
    let extra_json: DatabaseObject['extra_json'];

    switch (action.type) {
        case ActionType.extraEditorChange:
            return {
                ...trimmedState,
                extra_json: {
                    ...trimmedState.extra_json,
                    [action.payload.name]: action.payload.json,
                },
            };
        case ActionType.extraInputChange:
            if (
                action.payload.name === 'schema_cache_timeout' ||
                action.payload.name === 'table_cache_timeout'
            ) {
                return {
                    ...trimmedState,
                    extra_json: {
                        ...trimmedState.extra_json,
                        metadata_cache_timeout: {
                            ...trimmedState.extra_json?.metadata_cache_timeout,
                            [action.payload.name]: action.payload.value,
                        },
                    },
                };
            }
            if (action.payload.name === 'schemas_allowed_for_file_upload') {
                return {
                    ...trimmedState,
                    extra_json: {
                        ...trimmedState.extra_json,
                        schemas_allowed_for_file_upload: (action.payload.value || '').split(
                            ',',
                        ),
                    },
                };
            }
            return {
                ...trimmedState,
                extra_json: {
                    ...trimmedState.extra_json,
                    [action.payload.name]:
                        action.payload.type === 'checkbox'
                            ? action.payload.checked
                            : action.payload.value,
                },
            };
        case ActionType.inputChange:
            if (action.payload.type === 'checkbox') {
                return {
                    ...trimmedState,
                    [action.payload.name]: action.payload.checked,
                };
            }
            return {
                ...trimmedState,
                [action.payload.name]: action.payload.value,
            };
        case ActionType.parametersChange:
            if (
                trimmedState.catalog !== undefined &&
                action.payload.type?.startsWith('catalog')
            ) {
                // Formatting wrapping google sheets table catalog
                const idx = action.payload.type?.split('-')[1];
                const catalogToUpdate = trimmedState?.catalog[idx] || {};
                catalogToUpdate[action.payload.name] = action.payload.value;

                const paramatersCatalog = {};
                // eslint-disable-next-line array-callback-return
                trimmedState.catalog?.map((item: CatalogObject) => {
                    paramatersCatalog[item.name] = item.value;
                });

                return {
                    ...trimmedState,
                    parameters: {
                        ...trimmedState.parameters,
                        catalog: paramatersCatalog,
                    },
                };
            }
            return {
                ...trimmedState,
                parameters: {
                    ...trimmedState.parameters,
                    [action.payload.name]: action.payload.value,
                },
            };
        case ActionType.addTableCatalogSheet:
            if (trimmedState.catalog !== undefined) {
                return {
                    ...trimmedState,
                    catalog: [...trimmedState.catalog, { name: '', value: '' }],
                };
            }
            return {
                ...trimmedState,
                catalog: [{ name: '', value: '' }],
            };
        case ActionType.removeTableCatalogSheet:
            trimmedState.catalog?.splice(action.payload.indexToDelete, 1);
            return {
                ...trimmedState,
            };
        case ActionType.editorChange:
            return {
                ...trimmedState,
                [action.payload.name]: action.payload.json,
            };
        case ActionType.queryChange:
            return {
                ...trimmedState,
                parameters: {
                    ...trimmedState.parameters,
                    query: Object.fromEntries(new URLSearchParams(action.payload.value)),
                },
                query_input: action.payload.value,
            };
        case ActionType.textChange:
            return {
                ...trimmedState,
                [action.payload.name]: action.payload.value,
            };
        case ActionType.fetched:
            // convert all the keys in this payload into strings
            if (action.payload.extra) {
                extra_json = {
                    ...JSON.parse(action.payload.extra || ''),
                } as DatabaseObject['extra_json'];

                deserializeExtraJSON = {
                    ...deserializeExtraJSON,
                    ...JSON.parse(action.payload.extra || ''),
                    metadata_params: JSON.stringify(extra_json?.metadata_params),
                    engine_params: JSON.stringify(extra_json?.engine_params),
                    schemas_allowed_for_file_upload:
                        extra_json?.schemas_allowed_for_file_upload,
                };
            }

            // convert query to a string and store in query_input
            query = action.payload?.parameters?.query || {};
            query_input = Object.entries(query)
                .map(([key, value]) => `${key}=${value}`)
                .join('&');

            if (
                action.payload.encrypted_extra &&
                action.payload.configuration_method ===
                CONFIGURATION_METHOD.DYNAMIC_FORM
            ) {
                const engineParamsCatalog = Object.entries(
                    extra_json?.engine_params?.catalog || {},
                ).map(([key, value]) => ({
                    name: key,
                    value,
                }));
                return {
                    ...action.payload,
                    engine: action.payload.backend || trimmedState.engine,
                    configuration_method: action.payload.configuration_method,
                    extra_json: deserializeExtraJSON,
                    catalog: engineParamsCatalog,
                    parameters: action.payload.parameters,
                    query_input,
                };
            }

            return {
                ...action.payload,
                encrypted_extra: action.payload.encrypted_extra || '',
                engine: action.payload.backend || trimmedState.engine,
                configuration_method: action.payload.configuration_method,
                extra_json: deserializeExtraJSON,
                parameters: action.payload.parameters,
                query_input,
            };

        case ActionType.dbSelected:
            return {
                ...action.payload,
            };

        case ActionType.configMethodChange:
            return {
                ...action.payload,
            };

        case ActionType.reset:
        default:
            return null;
    }
}



const DEFAULT_TAB_KEY = '1';

const serializeExtra = (extraJson: DatabaseObject['extra_json']) =>
    JSON.stringify({
        ...extraJson,
        metadata_params: JSON.parse((extraJson?.metadata_params as string) || '{}'),
        engine_params: JSON.parse((extraJson?.engine_params as string) || '{}'),
        schemas_allowed_for_file_upload: (
            extraJson?.schemas_allowed_for_file_upload || []
        ).filter(schema => schema !== ''),
    });

const DatasourceModal: FunctionComponent<DatasourceModalProps> = ({
    addDangerToast,
    addSuccessToast,
    onDatabaseAdd,
    onHide,
    show,
    databaseId,
    dbEngine,
}) => {
    const [db, setDB] = useReducer<
        Reducer<Partial<DatabaseObject> | null, DBReducerActionType>
    >(dbReducer, null);

    const onClose = () => {
        onHide();
    };
    const renderAvailableConnector = () => (
        <div className="available">
            <h4 className="available-label">
                {t('Or choose from a list of other datasource connector type we support:')}
            </h4>
            <div className="control-label">{t('Supported connector type')}</div>
            <AntdSelect
                className="available-select"
                onChange={() => { }}
                placeholder={t('Choose a connector type...')}
                showSearch
            >
                <AntdSelect.Option value="mysql" key="mysql">
                    MySQL
                </AntdSelect.Option>
                <AntdSelect.Option value="postgresql" key="postgresql">
                    PostgreSQL
                </AntdSelect.Option>
                <AntdSelect.Option value="minio" key="minio">
                    minIO
                </AntdSelect.Option>
                <AntdSelect.Option value="Other" key="Other">
                    {t('Other')}
                </AntdSelect.Option>
            </AntdSelect>
        </div>
    );

    return (

        <Modal
            css={(theme: SupersetTheme) => [
                antDModalNoPaddingStyles,
                antDModalStyles(theme),
                formHelperStyles(theme),
                formStyles(theme),
            ]}
            name="database"
            onHandledPrimaryAction={() => { }}
            onHide={onClose}
            primaryButtonName={t('Add')}
            width="500px"
            centered
            show={show}
            title={<h4>{t('Add a datasource')}</h4>}
        // footer={renderModalFooter()}
        >
            <ModalStyle>
                {renderAvailableConnector()}
            </ModalStyle>
            {/* <ModalHeader
          isLoading={isLoading}
          isEditMode={isEditMode}
          useSqlAlchemyForm={useSqlAlchemyForm}
          hasConnectedDb={hasConnectedDb}
          db={db}
          dbName={dbName}
          dbModel={dbModel}
          fileList={fileList}
        /> */}
            {/* {passwordNeededField()}
        {confirmOverwriteField()} */}
        </Modal>

    );


};

export default withToasts(DatasourceModal);

