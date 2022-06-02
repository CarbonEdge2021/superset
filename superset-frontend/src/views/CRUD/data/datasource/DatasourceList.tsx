import React, {
  FunctionComponent, useEffect, useMemo, useState,
} from 'react';
import { t, styled } from '@superset-ui/core';
import withToasts from 'src/components/MessageToasts/withToasts';
import SubMenu, {
  SubMenuProps,
} from 'src/views/components/SubMenu';
import ListView from 'src/components/ListView';
import { commonMenuData } from 'src/views/CRUD/data/common';
import { Tooltip, notification } from 'antd';
import Icons from 'src/components/Icons';
import { DatasourceObject } from './types';
import DeleteModal from 'src/components/DeleteModal';
import DatasourceModal from './DatasourceModal';
import { DEFAULT_BE_URL } from 'packages/superset-ui-core/src/connection/constants';

const PAGE_SIZE = 25;

interface DatasourceListProps {

}

const Actions = styled.div`
  color: ${({ theme }) => theme.colors.grayscale.base};

  .action-button {
    display: inline-block;
    height: 100%;
  }
`;

const DatasourceList: FunctionComponent<DatasourceListProps> = ({

}) => {
  const datasourceCount = 0;
  const [datasources, setDatasources] = useState<DatasourceObject[]>([]);

  useEffect(() => {
    fetch(DEFAULT_BE_URL + "/api/v1/connector/list_connections", {
      method: "GET"
    }).then((res) => res.json())
      .then(res => {
        if (res.ret == 0) {
          setDatasources(res.data);
        }
      })
  }, [])

  const fetchData = () => { }
  const loading = false;

  function handleDatasourceDelete({ catalog_id }: DatasourceObject) {
    fetch(DEFAULT_BE_URL + "/api/v1/connector/delete_connection", {
      method: "POST",
      body: JSON.stringify({ catalog_id })
    }).then((res) => res.json())
      .then(res => {
        notification.open({
          message: 'Test Connection',
          description: res.msg,
          onClick: () => {
            console.log('Notification Clicked!');
          },
        });
      })
  }



  const [currentDatasource, setCurrentDatasource] = useState<DatasourceObject | null>(
    null,
  );

  // const fakeData = [{
  //   catalog_id: "catalog_test",
  //   connector_type: "mysql",
  //   data: {
  //     connector_name: "mysql",
  //     connection_url: "url",
  //     connection_user: "user",
  //     connection_password: "password"
  //   }
  // }]

  const [datasourceModalOpen, setDatasourceModalOpen] = useState<boolean>(false);
  const [datasourceCurrentlyDeleting, setDatasourceCurrentlyDeleting] =
    useState<DatasourceObject | null>(null);
  function handleDatasourceEditModal({
    datasource = null,
    modalOpen = false,
  }: { datasource?: DatasourceObject | null; modalOpen?: boolean } = {}) {
    setCurrentDatasource(datasource);
    setDatasourceModalOpen(modalOpen);
  }

  const menuData: SubMenuProps = {
    activeChild: 'Data source',
    ...commonMenuData,
  };

  menuData.buttons = [
    {
      'data-test': 'btn-create-datasource',
      name: (
        <>
          <i className="fa fa-plus" /> {t('Datasource')}{' '}
        </>
      ),
      buttonStyle: 'primary',
      onClick: () => {
        // Ensure modal will be opened in add mode
        handleDatasourceEditModal({ modalOpen: true });
      },
    },
  ];

  const openDatasourceDeleteModal = (datasource: DatasourceObject) => {
    setDatasourceCurrentlyDeleting(datasource)
  };

  const columns = useMemo(
    () => [
      {
        accessor: 'catalog_id',
        Header: t('Catalog ID'),
      },
      {
        accessor: 'connector_type',
        Header: t('Connector Type'),
        size: 'lg',
      },
      {
        Cell: ({ row: { original } }: any) => {
          const handleEdit = () =>
            handleDatasourceEditModal({ datasource: original, modalOpen: true });
          const handleTest = () => {
            fetch(DEFAULT_BE_URL + "/api/v1/connector/test_connection", {
              method: "POST",
              body: JSON.stringify({ catalog_id: original.catalog_id })
            }).then((res) => res.json())
              .then(res => {
                notification.open({
                  message: 'Test Connection',
                  description: res.msg,
                  onClick: () => {
                    console.log('Notification Clicked!');
                  },
                });
              })
          }
          const handleDelete = () => openDatasourceDeleteModal(original);
          return (
            <Actions className="actions">
              {(
                <Tooltip
                  id="edit-action-tooltip"
                  title={t('Test')}
                  placement="bottom"
                >
                  <span
                    role="button"
                    className="action-button"
                    onClick={handleTest}
                  >
                    <Icons.Refresh data-test="edit-alt" />
                  </span>
                </Tooltip>
              )}
              {(
                <Tooltip
                  id="edit-action-tooltip"
                  title={t('Edit')}
                  placement="bottom"
                >
                  <span
                    role="button"
                    className="action-button"
                    onClick={handleEdit}
                  >
                    <Icons.EditAlt data-test="edit-alt" />
                  </span>
                </Tooltip>
              )}
              {(
                <span
                  role="button"
                  className="action-button"
                  onClick={handleDelete}
                >
                  <Tooltip
                    id="delete-action-tooltip"
                    title={t('Delete database')}
                    placement="bottom"
                  >
                    <Icons.Trash />
                  </Tooltip>
                </span>
              )}

            </Actions>
          );
        },
        Header: t('Actions'),
        id: 'actions',
        disableSortBy: true,
      },
    ],
    []
  );

  return (
    <>
      <SubMenu {...menuData} />
      <DatasourceModal
        catalogId={currentDatasource?.catalog_id}
        show={datasourceModalOpen}
        onHide={handleDatasourceEditModal}
        connection={currentDatasource}
        isEditMode={!!currentDatasource}
      />
      {datasourceCurrentlyDeleting && (
        <DeleteModal
          description={t(
            'deleting...'
          )}
          onConfirm={() => {
            if (datasourceCurrentlyDeleting) {
              handleDatasourceDelete(datasourceCurrentlyDeleting);
            }
          }}
          onHide={() => setDatasourceCurrentlyDeleting(null)}
          open
          title={t('Delete Database?')}
        />
      )}
      <ListView<DatasourceObject>
        className="datasource-list-view"
        columns={columns}
        count={datasourceCount}
        data={datasources}
        fetchData={fetchData}
        loading={loading}
        pageSize={PAGE_SIZE}
      />
    </>
  );
};

export default withToasts(DatasourceList);
