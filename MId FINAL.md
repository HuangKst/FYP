[TOC]



# 1. Abstract

This system is a comprehensive one aimed at small and micro businesses. The main purpose of developing it is to improve my parents' work environment by transitioning from handwritten invoices to computer-printed ones, with all data visualized. Therefore, the system must be simple and easy to use, as my parents' generation generally has a lower level of education, and they may not be able to handle complex operations, which could lead to abandoning the system. I hope this system can help people like them.

My parents' business involves stainless steel pipe wholesale and stainless steel fittings. Stainless steel comes in three types: 201, 304, and 316, with many different specifications. As they get older, they often make mistakes or forget the quantities of certain specifications. This system aims to address these issues and improve operational efficiency and reducing errors.

# 2. Similar System 

## 2.1 odoo 

![image-20250103103339615](D:/Typora/img/image-20250103103339615.png)

​                                                             *Figure 2.1: Odoo Dashboard overview*

Odoo is an open-source enterprise management software platform offering a suite of integrated applications to manage all aspects of your business, including customer management (CRM), finance, inventory, human resources, e-commerce, and project management. It has a modular design, and enterprises can select functions according to their actual needs. It also possesses open-source customizability and a user-friendly interface that is fit for enterprises of any scale to optimize operational productivity. [1]

## 2.2 megaventory

![image-20250103103944628](D:/Typora/img/image-20250103103944628.png)

​                                                             *Figure 2.2-1: Megaventory Dashboard overview*

Megaventory is a cloud-based inventory and order management solution for small and medium-sized enterprises. It offers multi-warehouse inventory tracking, sales and purchase order processing, the ability to help with production planning, and real-time reporting capabilities while also supporting e-commerce and accounting tool integration. Wholesalers, retailers, and manufacturers use stamps and systems adaptability to manage challenging supply chains and improve operational processes in a simple user interface. [2]



## 2.3 Compare with my system

There is no doubt that the similar systems are more mature, more flexible, and have established technical architecture and reliability. Their security is also certainly better than that of my system. They have stronger analytics and AI-enabled reporting. They are more in line with international business , globalization support, multi-language, and multi-currency support. But my system is unique to a specific industry, especially to produce and sell stainless steel pipes and fittings. I have tailored it to specific needs (management of different materials, orders made by weight, complex inventory management, etc.). My system holds a better fit for this category of people. My system will cost less.



# 3. Requirement of the system 

## 3.1 Functional requirement 

These are about **what the system will do** in some detail focusing on the system’s features and behaviour

### 3.1.1 User Authentication and Authorization

- Register/ Login and Logout of the user
- Users can be verified by some admin & they are given special permission
- Session management and API access secured using JWT

### 3.1.2 **Customer Management**

- Add new customers with information (name, phone, address and notes).
- Attaching the fuzzy search for your search customers
- Modifying customer information (deletion requires admin approval)

### 3.1.3 Order Tracking

Track paid and unpaid orders for a specific customer

### 3.1.4 **Order Management**

- Create Orders (Purchase or Quotation)
- See all orders (paid, unpaid, incomplete and quotation order)
- Create distinct order numbers automatically based on the schema `YYYYMMDD+00.`
- Mark as paid or fulfiled orders.
- Export orders as PDFs or images.

### 3.1.5 **Inventory Management**

- Add materials to the inventory
- Material stock levels and specifications updates
- Consume materials upon creating an order or update an existing one
- Load inventory from an Excel file.
- Browse inventory by material classification and grade.

### 3.1.6 **Steel Price Management**

- Automatically retrieve and show daily price values for stainless steel and carbon steel.
- Keeping historical prices for later analysis

### 3.1.7 **Employee Management**

- Decline employees, and update their profile
- Update leave and overtime hours for employees.
- Employee CRUD operations (View, Edit, Delete)

### 3.1.8 Reporting and Analytics

- Create and download as a PDF report for unpaid orders.
- Process a monthly sale to appear as bar charts on the dashboard.
- Display real-time information about outstanding sums (sum of unpaid orders).

### 3.1.9 Notifications

- Alert the users when inventory is low or not sufficient to place an order.
- As a customer has overdue payments, notify the users.

## 3.2 Non-functional requirements

### 3.2.1 Performance requirements

- Support a certain amount of concurrency (set according to the actual user scale) to ensure normal response under high concurrency.

- For batch operations such as order generation and inventory import, a faster response speed or a feasible background processing mechanism is required.


### 3.2.2 Security

- Login uses JWT Token verification to ensure communication security and reduce the risk of attack.

- Administrator permissions or key confirmation are required for sensitive operations (such as deleting orders, paying orders, importing inventory, registering new users, etc.).

- HTTPS is recommended for data transmission (especially login, order payment, etc.).


### 3.2.3 Availability

- The system interface is friendly and the operation process is simple, which is easy to get started quickly.

- Provide necessary error prompts, exception capture processing and log records to reduce the difficulty of use.


### 3.2.4 Maintainability

- Adopt modular design to develop and maintain login modules, order modules, inventory modules, customer modules, employee modules, etc. relatively independently.

- The data structure is clear and can be managed uniformly through database tables or documents.


### 3.2.5 Scalability

- Reserved interfaces are convenient for subsequent integration (such as docking with other financial systems, SMS reminders, third-party payments, etc.).

- The logic of quotation calculation and inventory update is configurable to meet the expansion requirements of more materials or more pricing methods in the future.


### 3.2.6 Fault tolerance

- There should be reasonable verification, prompts and fallback mechanisms for insufficient inventory, repeated customers, network failures, Excel import format errors, etc.


### 3.2.7 Logs and audits

- Key operations (such as order payment, order deletion, inventory modification, etc.) need to record operation logs to facilitate auditing and tracking problems.


### 3.2.8 Deployment and environment requirements

- The system can run in common server environments (Windows) and supports conventional databases (MySQL ).

- It is recommended to use containerized deployment (Docker) to facilitate version management and horizontal expansion.

# 4. Database Design

![image-20250103142704309](D:/Typora/img/image-20250103142704309.png)

​                                                             *Figure 4-1: Database Architectural*

## 4.1 Introduce DB

In this system I will use the mysql DB to store the data. And below is the tales of the DB which are created according to the main feathers of the system.

- User and Permissions : `users `
- Steel Prices: `daily_material_price `
- Order Management :  `orders`, `order_items` 
- Customer Management: `customers`
- Inventory Management :  `inventory`
- Employee Management:  `employees`, `employee_leaves`, `employee_overtimes`
- System Logs : `system_logs`

## 4.2 Module Division 

- **User and Permissions** 

  Handel the process of login and register and administrator review

- **Steel Prices**

  Records of steel prices of different materials provide reference for quotation or ordering.

- **Order Management**

  The order master table and order detail table are linked by foreign keys to perform one-to-many storage. Can distinguish between `sales orders (SALES)` and `quotation orders (QUOTE)`

- **Customer Management**

  Stores basic customer information and is associated with the order table through a foreign key.

- **Inventory Management**

  Maintain inventory information (material, specification, quantity, specific gravity, etc.), and deduct inventory accordingly after an order is generated.

- **Employee Management**

  Employee basic information form, as well as employee leave form and overtime form, are used for attendance management.

- **System Logs**

  Record key system operation logs, such as creating orders, paying orders, deleting data, etc.

## 4.3 ER Table for the DB [3]

![Untitled diagram-2025-01-03-113129](D:/Typora/img/Untitled%20diagram-2025-01-03-113129.png)

​                                                               *Figure 4.3-1: Database ER Diagram*

1. **User and System Logs**

   One-to-Many: A user can generate multiple system logs (`system_logs.user_id` foreign key points to `users.id`).

2. **Customer and Orders**

   One-to-Many: A customer can have multiple orders, and each order corresponds to only one customer (`orders.customer_id` foreign key points to `customers.id`).

3. **Order and Order Items**

   One-to-Many: An order can contain multiple order details (`order_items.order_id` foreign key points to `orders.id)`.

4. **Employees and Leaves / Overtimes**

   One-to-Many: An employee can have multiple leave records or overtime records (`employee_leaves.employee_id, employee_overtimes.employee_id` foreign keys point to `employees.id` respectively).

5. **Inventory**

   Inventory is stored independently, and the outbound operations of different orders will be updated in the business layer.

6. **Daily Material Price (Steel Daily Price)**

   The prices of different materials and dates are stored independently. The unit price of the day can be queried based on the date and material, providing data support for order quotations or statistics.

# 5. UML 

## 5.1 User Case Diagram 

![image-20250103094928992](D:/Typora/img/image-20250103094928992.png)

​                                                             *Figure 5.1-1: User Case Diagram*

## 5.2 Flow Chart

### 5.2.1 User Registration & Administrator Review Process

![Untitled diagram-2025-01-03-004543](D:/Typora/img/Untitled%20diagram-2025-01-03-004543.png)

​                                      *Figure 5.2.1-1: User Registration & Administrator Review Process*

This flowchart shows the process of user registration:

1. User registration: The user fills in the registration information.

2. Information verification:

    If the information is invalid, the system prompts the user to re-enter; 

   if the information is valid, the system saves it to the database and sets it to "pending review".

3. Administrator review: The administrator views the new user registration list:

4. If rejected, the user status is set to "inactive" and cannot log in.

5. If approved, the user status is set to "activated" and an activation notification is sent.

6. Process completion: After receiving the notification, the user can log in to the system and complete the registration process.

### 5.2.2 Create order (sales/quotation) process

<img src="D:/Typora/img/Untitled%20diagram-2025-01-03-004130.png" alt="Untitled diagram-2025-01-03-004130" style="zoom:67%;" />

​                                                                   *Figure 5.2.2-1: Created Order Process*

This flowchart shows the process of a user creating an order (sales order or quotation) in the system. Here is a brief explanation of the process:

1. User login the system 

2. Choose the `create order`option

3. User choose the type of the order (sale or quotation)

4. Search the customer name 

5. Add the detail of the order such as materials, specifications, quantities and remarks

6. Determine the way to caculate the 

   - calculate the subtotal as unit price × quantity.

   - calculate the subtotal as unit price per kilogram × weight.

7. Calculate the total price 

8. Check whether the inventory is sufficient to meet sales demand

9. After saving the order, the system will generate a unique order number (in the format of YYYYMMDDXX).

10. Show that the order has been saved successfully and return to the order list .

### 5.2.3 Mark order payment process

![image-20250103003310299](D:/Typora/img/image-20250103003310299.png)

​                                                                 *Figure 5.2.3-1: Make Oder Payment Process*

The flowchart shows the process of order management:

1. Enter order management: The user enters the "Order Management" page and  can select an order to view.

2. Order status judgment:

   If the order has been paid, no operation is required and it returns to the order list directly.

   If the order has not been paid, the user can select "Mark as paid".

3. Authorization verification: The system determines whether the user has the authority to perform the operation:

   If there is no authority, it prompts that the operation is denied and requires the administrator password to be entered.

   If there is authority, the order status is set to paid and the operation log (including user ID and operation type) is recorded.

4. Complete the operation: Return to the order list and display the updated status, and the process ends.

## 5.3 Sequence diagram 

### 5.3.1 Login  And Register Process

#### 5.3.1.1 Login Porcess

![loginZENUML](D:/Typora/img/loginZENUML.png)

​                                                      *Figure 5.3.1.1-1: Login Process Sequence Diagram*

User input the username and password, system will verify the information if success will return the JWT Token. If fail the system will return the error message

#### 5.3.1.2 Register Process

![image-20250103123711038](D:/Typora/img/image-20250103123711038.png)

​                                                      *Figure 5.3.1.2-1: Register Process Sequence Diagram*

Register process needs the admin to audit the request. If the admin approve the register the status of the user will set as the `active` .

### 5.3.2 HomePage Process

![Untitled diagram-2025-01-03-111306](D:/Typora/img/Untitled%20diagram-2025-01-03-111306.png)

​                                                      *Figure 5.3.2-1: HomePage Process Sequence Diagram*

When the user login successfully, system will show the steel price,, total outstanding balances and uncompleted orders is displayed on the homepage as a dashboard just like the home page in the odoo system .

### 5.3.3 Create the order Process

#### 5.3.3.1 Production Order Process 

![Untitled diagram-2025-01-03-111755](D:/Typora/img/Untitled%20diagram-2025-01-03-111755.png)

​                                                *Figure 5.3.3.1-1: Production Order Process Sequence Diagram*

Production order supports the weight or numbers to calculate the total price, choose customer can use fuzzy searching. If the inventory is insufficient inventory will show a alarm and you can add the inventory in the order page .

#### 5.3.3.2 Quotation Order Process

![Untitled diagram-2025-01-03-111855](D:/Typora/img/Untitled%20diagram-2025-01-03-111855.png)

​                                               *Figure 5.3.3.2-1: Quotation Order Process Sequence Diagram*

Quotation order will not reduce the inventory immediately which only contain the information of the order in the order list and give a tag "Quatation" in this order.Then you can change the order into the production order in order management system later. 

### 5.3.4 Customer Management Process 

![Untitled diagram-2025-01-03-112146](D:/Typora/img/Untitled%20diagram-2025-01-03-112146.png)

​                                     *Figure 5.3.4-1: Customer Management Process Sequence Diagram*

Customer Manage can search the information of the customer and their own the historical orders. And it can export the unpaid order as the pdf. And it can pay order or delete the order .

### 5.3.5 Inventory Manage Process

![Untitled diagram-2025-01-03-112402](D:/Typora/img/Untitled%20diagram-2025-01-03-112402.png)

​                                               *Figure 5.3.5-1: Inventory Manage Process Sequence Diagram*

Inventory Manage is used to check the available materials and specifications, and their numbers and weight. What's more the system provide a function to batch import, single item addition or modification functions, and inventory query.

### 5.3.6 Order Management Process

![Untitled diagram-2025-01-03-112324](D:/Typora/img/Untitled%20diagram-2025-01-03-112324.png)

​                                            *Figure 5.3.6-1: Order Management Process Sequence Diagram*

Order management can check all the orders and sorted by payment status,order type and fullfilled status. Support to transform the quotation order into the formal order and user can pay the order in this model. 

### 5.3.7 Employee Management Process

![Untitled diagram-2025-01-03-112446](D:/Typora/img/Untitled%20diagram-2025-01-03-112446.png)

​                                          *Figure 5.3.1.1-1:Employee Management Process Sequence Diagram*

Admin can add and delete the employees. Also can manage and record the leave and overtime.

# 6. System Web Page 

## System Temporary logo

The logo is created by GPT 

<img src="D:/Typora/img/logo.webp" alt="logo" style="zoom:33%;" />

​                                                                            *Figure 6-1: Web Logo*

## 6.1 Login Page 

![image-20250103154929042](D:/Typora/img/image-20250103154929042.png)

​                                                                         *Figure 6.1-1: Login Page*

## 6.2 Signup Page 

![image-20250103155014464](D:/Typora/img/image-20250103155014464.png)

​                                                                         *Figure 6.2-1: Signup Page*

## 6.3 Pending Page 

When you signup  the user you can not login,need admin to approve.

![image-20250103155241924](D:/Typora/img/image-20250103155241924.png)

​                                                                  *Figure 6.3-1: Pending Notification*

![image-20250103155522463](D:/Typora/img/image-20250103155522463.png)

​                                                                         *Figure 6.3-2: Pending Page*

Only the admin and boss can visit the page and appove the user.

## 6.4 Temp Home Page 

The home page is a test home page later I will recreate the home page 

**![image-20250103155502049](D:/Typora/img/image-20250103155502049.png)**

​                                                                         *Figure 6.4-1: Home Page*

# 7. Software 

- **Visual Studio Code:**

  version: 1.96.2 (user setup)

- **Node.js:** 

  version: 20.18.1

- **Postman:**

  version:11.23.3

- **Navicat:**

  version: 16.0.11 - Premium

- **Mysql**:

  version:  8.0.35 for Win64 on x86_64 (MySQL Community Server - GPL)

# 8. Technology

## 8.1 Front-end

The front-end technology stack includes a lot of the stuff you need to build modern React applications, from frameworks (you have React) and routing (React Router), through requests (Axios), state management (React Query), UI design (MUI), and testing (Jest), and performance optimization (Web Vitals).

1. **React Ecosystem**[4]
   - **React**: A core library for building user interfaces, providing a component-based development approach and improving performance through state management and virtual DOM.
   - **React DOM**: Renders React components in the browser and interacts with the real DOM.
   - **React Router DOM**: Implements the routing function of single-page applications (SPAs), provides URL path management, and supports page jumps without refreshing.
   - **React Hook Form:** Used for form management, lightweight, high-performance, supports form validation and reduces code redundancy.
   - **React Query**: A data request and cache management library that handles asynchronous data acquisition, caching, and error management to improve development efficiency.

2. **Axios**
   - **Purpose**: Used to send HTTP requests and communicate with the backend.
   - **Features**: Provides a simple API, supports request interception, response interception, and error handling, and is the core tool for data requests.

3. **Material-UI (MUI) and Emotion**
   - **Material-UI (MUI)**: A set of UI component libraries based on Google Material Design that provide modern, responsive design and simplify interface development.
   - **Emotion**: CSS-in-JS library, deeply integrated with MUI, can dynamically generate and manage styles, load on demand, and improve style flexibility.

4. **React Slick and Slick Carousel**
   - **React Slick**: A React version based on Slick, used to create sliding carousel components, supporting responsive design.
   - **Slick Carousel**: A basic library for carousel functions, supporting infinite scrolling, custom navigation, and multiple animation effects.

5. **Jest and Testing Library**
   - **Purpose**: Testing tools to ensure the stability of React applications.
   - **Features:** Provide tools for testing the behavior and interaction of React components to help verify code logic and user experience.

6. **Web Vitals**
   - **Purpose**: Used to measure web page performance.
   - **Features**: Provide key performance indicators such as loading speed and interactive response time to optimize user experience.

7. **React Scripts**
   - **Purpose**: Manage React projects and provide scaffolding tools for quick startup, building, and testing.
   - **Features**: Integrate tools such as webpack and Babel to hide complex configurations and improve development efficiency.

## 8.2 Back-end 

Using Express as the core framework, Sequelize and MySQL2 abstract database query. It can also provide authentication behind the icon, and password security with bcrypt use, CORS and Dotenv with security, express async handler handles the error and handles promise rejection together and improves development efficiency by using nodemon.

1. **Express**
    **Purpose**: Used to build backend servers and APIs.
    **Features**: A lightweight Node.js framework that supports routing, request processing, and middleware, suitable for rapid development.
2. **Sequelize**
    **Purpose**: ORM (object-relational mapping) library for Node.js.
    **Features**: Interact with database tables through models, support database queries, associations, migrations, and other operations, and is compatible with multiple databases such as MySQL and PostgreSQL.
3. **MySQL2**
    **Purpose**: Node.js driver for MySQL database.
    **Features**: Provides high-performance database connections, supports Promise and asynchronous operations, and integrates well with Sequelize.
4. **bcrypt**
    **Purpose**: Used for password encryption and verification.
    **Features**: Provides a strong one-way encryption algorithm suitable for secure storage of user passwords.
5. **JSON Web Token (JWT)**
    **Purpose**: Used for user authentication.
    **Features**: Achieve stateless user authentication and authorization by generating and verifying tokens.
6. **CORS (Cross-Origin Resource Sharing)**
    **Purpose**: Solve cross-domain problems.
    **Features**: Allow the front-end to request back-end resources across domains, ensuring security and flexibility.
7. **Dotenv**
    **Purpose**: Manage environment variables.
    **Features**: Load environment variables from .env files to ensure that sensitive information (such as database connection information, JWT keys) is not exposed in the code.
8. **Express Async Handler**
    **Purpose**: Simplify asynchronous error handling.
    **Features**: Capture asynchronous errors in Express routes, reduce code redundancy, and optimize error handling logic.
9. **Nodemon**
    **Purpose**: Development auxiliary tool (development dependency).
    **Features**: Automatically restart Node.js applications to improve development efficiency without manually restarting services.

# 9.Timeline 

| **Phase**  | **Date Range**  | **Tasks**                                                    |
| ---------- | --------------- | :----------------------------------------------------------- |
| Week 1-2   | Jan 10 - Jan 23 | Enhance backend functionality, optimize APIs, and add necessary backend services. |
| Week 3-4   | Jan 24 - Feb 6  | Develop frontend interfaces and integrate basic UI functionalities. |
| Week 5-6   | Feb 7 - Feb 20  | Adjust backend APIs and complete initial frontend-backend integration. |
| Week 7-8   | Feb 21 - Mar 5  | Conduct frontend-backend integration testing, fix bugs, and optimize user interaction. |
| Week 9-10  | Mar 6 - Mar 19  | Expand frontend features and enhance advanced UI modules.    |
| Week 11-12 | Mar 20 - Apr 2  | Perform comprehensive testing (unit tests, integration tests, performance tests). |
| Week 13-14 | Apr 3 - Apr 16  | Deploy to the staging environment and conduct User Acceptance Testing (UAT). |
| Week 15-16 | Apr 17 - Apr 30 | Address testing feedback and prepare for production deployment. |
| Week 17-18 | May 1 - May 14  | Deploy to production and carry out final maintenance and monitoring. |



# Reference 

[1] https://www.odoo.com/zh_CN/app/inventory

[2] [Inventory Management - Order fulfillment - Manufacturing](https://www.megaventory.com/#whoisthisfor)

[3] [MySQL :: MySQL Documentation](https://dev.mysql.com/doc/) 

[4]https://zh-hans.react.dev/