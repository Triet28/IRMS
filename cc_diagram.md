```
+=========================================================================+
|                            CLIENT  TIER                                 |
|  +------------------+  +----------------------+  +-----------------+   |
|  |  Staff POS App   |  | Kitchen Display KDS  |  | Admin/Manager   |   |
|  +------------------+  +----------------------+  |   Dashboard     |   |
|                                                   +-----------------+   |
+=========================================================================+
  REST API   |      ^ WSS              ^ WSS(NewOrder,      REST API    |
 (Order, Menu|      | (OrderReady)     |  Warning)          (Reports,   |
  Table)     v      |                  |                     Menu Setup) v
+=========================================================================+
|               API GATEWAY & LOAD BALANCER  (Nginx / Kong)               |
|    +-------------------------------------------------------------------+ |
|    |                Auth Service  (RBAC / JWT Validation)              | |
|    +-------------------------------------------------------------------+ |
+=========================================================================+
          |                       |                           |
          v          +------------------------+               v
+--------------------+|   WebSocket Manager   |  +----------------------+
| 0. Menu  Service   ||      (Push Noti)      |  |  6. Analytics /      |
| 1. Order Service   |+------------------------+  |     Admin Svc        |
| 2. Table &         |            ^               |  (Báo cáo,           |
|    Reserv. Svc     |            |               |   Quản lý Menu)      |
| 3. Inventory Svc   |            |               +----------------------+
|  (REST: Trừ kho    |            |
|   thủ công         |            |
|   -> Pub: Stock_Low|            |
+--------------------+            |
          |                       |                           |
          v                       |                           |
+=========================================================================+
‖                  MESSAGE BROKER  (RabbitMQ / Kafka)                     ‖
‖  [Topics: Order_Created · Order_Updated · Payment_Completed ·           ‖
‖           Stock_Low · Menu_Updated · Audit_Event]                       ‖
+=========================================================================+
          |               |                  |                |
          v               v                  v                v
+----------------+ +--------------+ +---------------+ +------------+
| 4. Billing Svc | | 5. Kitchen   | | 6. Analytics  | | 7. Audit   |
|                | |    Sync      | |  (Sub: All    | |    Log Svc |
| Sub:           | | Sub: Order_* | |   Events,     | |            |
|  Order_Created | | Action:      | |   real-time   | | Sub:       |
|  Order_Updated | |  Push WS     | |   dashboard)  | |  Audit_    |
+----------------+ +--------------+ +---------------+ |  Event)    |
          |               |                  |         +------------+
          v               v                  v                |
+=========================================================================+
|                    DATA ACCESS TIER  (JPA / Hibernate)                  |
+=========================================================================+
          |  (Heavy Writes / Sync Reads)              | (Heavy Reads)
          v                                           v
+---------------------------------+     +-----------------------------+
|       PRIMARY DB  (MASTER)      |     |     REPLICA DB  (SLAVE)     |
|  +---------------------------+  |     |  +-------------------------+ |
|  |   MySQL / PostgreSQL      |  |     |  |  MySQL / PostgreSQL     | |
|  |  (Orders, Menu, Inventory,|  |====>|  |  (Dùng riêng cho        | |
|  |   Tables, Billing, Audit) |  | Sync|  |   Analytics, Reports)   | |
|  +---------------------------+  |     |  +-------------------------+ |
+---------------------------------+     +-----------------------------+
```