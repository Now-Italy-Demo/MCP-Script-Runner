import '@servicenow/sdk/global'

declare global {
    namespace Now {
        namespace Internal {
            interface Keys extends KeysRegistry {
                explicit: {
                    bom_json: {
                        table: 'sys_module'
                        id: '0963b0adbc8d40e09646c0459948f378'
                    }
                    mcp_acl_execute: {
                        table: 'sys_security_acl'
                        id: '3d55cbdd3abe4e64b8420e28cf31efca'
                    }
                    mcp_route_admin_oauth_client: {
                        table: 'sys_ws_operation'
                        id: 'bd109f80b011423a8736f41cf79976d7'
                    }
                    mcp_route_admin_roles: {
                        table: 'sys_ws_operation'
                        id: '70afad86b8de4808bcbf151a588ed028'
                    }
                    mcp_route_admin_status: {
                        table: 'sys_ws_operation'
                        id: '729d2411ead646feb1fde120c4bfd325'
                    }
                    mcp_route_get: {
                        table: 'sys_ws_operation'
                        id: 'b540e876f8c24e258a45eb96197d72ae'
                    }
                    mcp_route_post: {
                        table: 'sys_ws_operation'
                        id: '645da368f7ab4fc3ad5fc03c9a2d2504'
                    }
                    mcp_script_execution_read_acl: {
                        table: 'sys_security_acl'
                        id: 'cb454a6b03c64715a80b59c817db219d'
                    }
                    mcp_script_runner_admin_module: {
                        table: 'sys_app_module'
                        id: '4245139030a8459a879356f3a9d3db4c'
                    }
                    mcp_script_runner_api: {
                        table: 'sys_ws_definition'
                        id: '021c36ef568443b2984d22411a178642'
                    }
                    mcp_script_runner_menu: {
                        table: 'sys_app_application'
                        id: '5db367ae2ab947a48cf94b2157576e62'
                    }
                    package_json: {
                        table: 'sys_module'
                        id: 'df3bacd8bcec445bb3c608fcbbb4e43d'
                    }
                    src_server_mcpHandler_ts: {
                        table: 'sys_module'
                        id: 'ab1e19dad2f64d0d85a2f6fa6974ff68'
                        deleted: true
                    }
                }
                composite: [
                    {
                        table: 'sys_dictionary'
                        id: '02c877867dbe485ebe368b8c1af8c091'
                        deleted: true
                        key: {
                            name: 'u_mcp_script_execution'
                            element: 'user'
                        }
                    },
                    {
                        table: 'sys_documentation'
                        id: '14f0739079414a288537f6fa8cfb4c03'
                        deleted: true
                        key: {
                            name: 'u_mcp_script_execution'
                            element: 'is_error'
                            language: 'en'
                        }
                    },
                    {
                        table: 'sys_db_object'
                        id: '3281f0e8c3534085ab4333c078421a22'
                        key: {
                            name: 'u_mcp_script_execution'
                        }
                    },
                    {
                        table: 'sys_documentation'
                        id: '34771ed5ce474e86bacd97492c02a234'
                        key: {
                            name: 'u_mcp_script_execution'
                            element: 'u_user_name'
                            language: 'en'
                        }
                    },
                    {
                        table: 'sys_dictionary'
                        id: '38ed3e1f439c469bad6096d6099fc2a4'
                        key: {
                            name: 'u_mcp_script_execution'
                            element: 'u_executed_at'
                        }
                    },
                    {
                        table: 'sys_documentation'
                        id: '3ee51ee531b741f69b88b7d66ea6ebdb'
                        key: {
                            name: 'u_mcp_script_execution'
                            element: 'u_user'
                            language: 'en'
                        }
                    },
                    {
                        table: 'sys_dictionary'
                        id: '499a4cf3c7de4547bdfe4dabfd01c8d4'
                        key: {
                            name: 'u_mcp_script_execution'
                            element: 'u_result'
                        }
                    },
                    {
                        table: 'sys_dictionary'
                        id: '520563c3e7e94f6d8d44993782b6c41c'
                        key: {
                            name: 'u_mcp_script_execution'
                            element: 'u_script'
                        }
                    },
                    {
                        table: 'sys_documentation'
                        id: '5a8e784a6f974c7397d945350978a4da'
                        deleted: true
                        key: {
                            name: 'u_mcp_script_execution'
                            element: 'script'
                            language: 'en'
                        }
                    },
                    {
                        table: 'ua_table_licensing_config'
                        id: '5cb53373ce184c8e9585f508ba16c42b'
                        key: {
                            name: 'u_mcp_script_execution'
                        }
                    },
                    {
                        table: 'sys_dictionary'
                        id: '60348355868043148d64c33c13a30877'
                        key: {
                            name: 'u_mcp_script_execution'
                            element: 'u_elapsed_ms'
                        }
                    },
                    {
                        table: 'sys_ui_page'
                        id: '75a313b7f0094b748dbb644f079e3b87'
                        key: {
                            name: 'mcp_script_runner_admin'
                        }
                    },
                    {
                        table: 'sys_dictionary'
                        id: '78fd916636684f25aa411370f0696043'
                        key: {
                            name: 'u_mcp_script_execution'
                            element: 'u_user'
                        }
                    },
                    {
                        table: 'sys_documentation'
                        id: '8729618ca0f34aa89049c9850312262b'
                        key: {
                            name: 'u_mcp_script_execution'
                            element: 'NULL'
                            language: 'en'
                        }
                    },
                    {
                        table: 'sys_user_role'
                        id: '8d756dbb4ad04bcebc75d06851e96d9a'
                        key: {
                            name: 'mcp_script_runner'
                        }
                    },
                    {
                        table: 'sys_dictionary'
                        id: '907e01506935493c9775f3a87d88c939'
                        key: {
                            name: 'u_mcp_script_execution'
                            element: 'u_user_name'
                        }
                    },
                    {
                        table: 'sys_dictionary'
                        id: '92702e1115e84229a11928afa9b963a6'
                        deleted: true
                        key: {
                            name: 'u_mcp_script_execution'
                            element: 'executed_at'
                        }
                    },
                    {
                        table: 'sys_documentation'
                        id: '9c5fdad1603f4499a9e2f9e1e871357c'
                        key: {
                            name: 'u_mcp_script_execution'
                            element: 'u_executed_at'
                            language: 'en'
                        }
                    },
                    {
                        table: 'sys_security_acl_role'
                        id: '9c77c78f31374e62861ee6cb27dff078'
                        key: {
                            sys_security_acl: 'cb454a6b03c64715a80b59c817db219d'
                            sys_user_role: {
                                id: '8d756dbb4ad04bcebc75d06851e96d9a'
                                key: {
                                    name: 'mcp_script_runner'
                                }
                            }
                        }
                    },
                    {
                        table: 'sys_dictionary'
                        id: 'a6a6347363ce4a58a0616291ec9a3dfc'
                        key: {
                            name: 'u_mcp_script_execution'
                            element: 'NULL'
                        }
                    },
                    {
                        table: 'sys_documentation'
                        id: 'a745a7bbc1914addb270ee23aeba7f77'
                        deleted: true
                        key: {
                            name: 'u_mcp_script_execution'
                            element: 'result'
                            language: 'en'
                        }
                    },
                    {
                        table: 'sys_documentation'
                        id: 'a8c74a10aef9495396ef6140dedc65f4'
                        deleted: true
                        key: {
                            name: 'u_mcp_script_execution'
                            element: 'user_name'
                            language: 'en'
                        }
                    },
                    {
                        table: 'sys_documentation'
                        id: 'ad1057da6f0a498f837003d270c48ce2'
                        deleted: true
                        key: {
                            name: 'u_mcp_script_execution'
                            element: 'user'
                            language: 'en'
                        }
                    },
                    {
                        table: 'sys_dictionary'
                        id: 'b1a0e47ba5f04851a1d53a02e7c414b0'
                        deleted: true
                        key: {
                            name: 'u_mcp_script_execution'
                            element: 'elapsed_ms'
                        }
                    },
                    {
                        table: 'sys_documentation'
                        id: 'b410bed528464b3ab3ea36512a584244'
                        key: {
                            name: 'u_mcp_script_execution'
                            element: 'u_elapsed_ms'
                            language: 'en'
                        }
                    },
                    {
                        table: 'sys_dictionary'
                        id: 'b4a3c8242e3d440b9c0e40157ff2f1af'
                        deleted: true
                        key: {
                            name: 'u_mcp_script_execution'
                            element: 'result'
                        }
                    },
                    {
                        table: 'sys_documentation'
                        id: 'b7703361e38745db9ef95ab3c5c920a8'
                        key: {
                            name: 'u_mcp_script_execution'
                            element: 'u_is_error'
                            language: 'en'
                        }
                    },
                    {
                        table: 'sys_dictionary'
                        id: 'cd3bfb815c2746a6ab6185d2ca535af5'
                        key: {
                            name: 'u_mcp_script_execution'
                            element: 'u_error_message'
                        }
                    },
                    {
                        table: 'sys_documentation'
                        id: 'd143698714aa4a059bbf4d593117714f'
                        deleted: true
                        key: {
                            name: 'u_mcp_script_execution'
                            element: 'elapsed_ms'
                            language: 'en'
                        }
                    },
                    {
                        table: 'sys_documentation'
                        id: 'd4cf0770420745d6b8152690f7fc9a05'
                        deleted: true
                        key: {
                            name: 'u_mcp_script_execution'
                            element: 'error_message'
                            language: 'en'
                        }
                    },
                    {
                        table: 'sys_security_acl_role'
                        id: 'da218a5345e74f40ace0e4c608b35447'
                        key: {
                            sys_security_acl: '3d55cbdd3abe4e64b8420e28cf31efca'
                            sys_user_role: {
                                id: '8d756dbb4ad04bcebc75d06851e96d9a'
                                key: {
                                    name: 'mcp_script_runner'
                                }
                            }
                        }
                    },
                    {
                        table: 'sys_dictionary'
                        id: 'ddc6af54fd9f43b69af3a7f692380c77'
                        deleted: true
                        key: {
                            name: 'u_mcp_script_execution'
                            element: 'error_message'
                        }
                    },
                    {
                        table: 'sys_documentation'
                        id: 'df5c45575c8f4bde85cee09f470f02c8'
                        key: {
                            name: 'u_mcp_script_execution'
                            element: 'u_error_message'
                            language: 'en'
                        }
                    },
                    {
                        table: 'sys_documentation'
                        id: 'e27ee9d419f34409afda3331e258f750'
                        key: {
                            name: 'u_mcp_script_execution'
                            element: 'u_script'
                            language: 'en'
                        }
                    },
                    {
                        table: 'sys_dictionary'
                        id: 'e55e75c643b94b68a6b91a50fda5d9cd'
                        deleted: true
                        key: {
                            name: 'u_mcp_script_execution'
                            element: 'user_name'
                        }
                    },
                    {
                        table: 'sys_documentation'
                        id: 'e907bb80f57e4ee58c6f06566986e568'
                        key: {
                            name: 'u_mcp_script_execution'
                            element: 'u_result'
                            language: 'en'
                        }
                    },
                    {
                        table: 'sys_dictionary'
                        id: 'ec829969e94e4545ba8e50d85ebd67ff'
                        key: {
                            name: 'u_mcp_script_execution'
                            element: 'u_is_error'
                        }
                    },
                    {
                        table: 'sys_dictionary'
                        id: 'f0eba8f0b10040b096f56b66e4d4a7cc'
                        deleted: true
                        key: {
                            name: 'u_mcp_script_execution'
                            element: 'is_error'
                        }
                    },
                    {
                        table: 'sys_dictionary'
                        id: 'f0ef2fa88600477f899ee6d2aecbfc7d'
                        deleted: true
                        key: {
                            name: 'u_mcp_script_execution'
                            element: 'script'
                        }
                    },
                    {
                        table: 'sys_documentation'
                        id: 'fcaeefc957fe47dd928ccef0c8c55378'
                        deleted: true
                        key: {
                            name: 'u_mcp_script_execution'
                            element: 'executed_at'
                            language: 'en'
                        }
                    },
                ]
            }
        }
    }
}
