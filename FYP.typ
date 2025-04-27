#let title = "Smart Steel"

// 定义引用函数，使其可以点击跳转到参考文献部分
#let cite(key) = link("references")[#key]

// 定义一个通用的代码块组件
#let code-block(lang, code, size: 10pt, padding: 8pt, bgcolor: luma(245)) = {
  block(
    fill: bgcolor,
    inset: padding,
    radius: 4pt,
    width: 100%,
  )[
    #code
  ]
}




#let project(title: "", author: "", student_id: "", supervisor: "") = {
  set document(title: title, author: author)
  set page(numbering: none, margin: (x: 2.5cm, y: 2.5cm))
  
  align(center)[
    #block(image("picture/schoolLogo.png", width: 80%))
    #v(1.5cm)
    #text(size: 2.5em, weight: "bold")[#title]
    #v(0.8cm)
    #text(size: 1.5em)[Final Year Project Report]
    #v(2.5cm)
    #text(size: 1.2em)[
      Student: #author \
      Student ID: #student_id \
      #v(0.8cm)
      Supervisor: #supervisor
    ]
    #v(3cm)
    #text(size: 1.2em)[
      School of Engineering \
      South East Technological University
    ]
  ]
  
  pagebreak()
  
  // Table of Contents page
  heading(outlined: false)[Table of Contents]
  v(1cm)
  outline(title: none, indent: true)
  
  pagebreak()
}

// 定义可重用的图片函数
#let project-figure(path, caption, width: 80%) = {
  figure(
    image(path, width: width),
    caption: [#caption]
  )
}

#project(
  title: "Smart Steel",
  author: "Zihan Huang",
  student_id: "20108869",
  supervisor: "Richie Lyng",
)

// 从这里开始设置页眉页脚，仅应用于正文部分
#set page(
  numbering: "1",
  header: {
    align(left)[#text(title)]
    line(length: 100%)
  },
  footer: {
    line(length: 100%)
    align(center)[#counter(page).display()]
  }
)

// 重置页码计数器为1
#counter(page).update(1)

// Main content starts here
= 1. Introduction

#set par(justify: true, first-line-indent: 1em)
#let section-spacing = 0.5cm

This system is a comprehensive solution aimed at small and micro businesses. The main purpose of developing it is to improve my parents' work environment by transitioning from handwritten invoices to computer-printed ones, with all data visualized. Therefore, the system must be simple and easy to use, as my parents' generation generally has a lower level of education, and they may not be able to handle complex operations, which could lead to abandoning the system. I hope this system can help people like them.

#v(section-spacing)

My parents' business involves stainless steel pipe wholesale and stainless steel fittings. Stainless steel comes in several types: 201, 304 and so on, with many different specifications. As they get older, they often make mistakes or forget the quantities of certain specifications. This system aims to address these issues and improve operational efficiency and reducing errors.

= 2. Similar Systems

== 2.1 Odoo

#project-figure("picture/Odoo.png", [Odoo Dashboard Overview])
Odoo is an open-source enterprise management software platform offering a suite of integrated applications to manage all aspects of your business, including customer management (CRM), finance, inventory, human resources, e-commerce, and project management. It has a modular design, and enterprises can select functions according to their actual needs. It also possesses open-source customizability and a user-friendly interface that is fit for enterprises of any scale to optimize operational productivity. #cite("[1]")
== 2.2 Megaventory
#project-figure("picture/Megaventory.png", [Megaventory Dashboard Overview])
Megaventory is a cloud-based inventory and order management solution for small and medium-sized enterprises. It offers multi-warehouse inventory tracking, sales and purchase order processing, the ability to help with production planning, and real-time reporting capabilities while also supporting e-commerce and accounting tool integration. Wholesalers, retailers, and manufacturers use stamps and systems adaptability to manage challenging supply chains and improve operational processes in a simple user interface. #cite("[2]")

= 3. Requirements of the system

== 3.1 Functional requirements

These are about what the system will do in some detail focusing on the system's features and behaviour.
*1. User Authentication and Authorization*

- Register/ Login and Logout of the user
- Users can be verified by some admin & they are given special permission
- Session management and API access secured using JWT

*2. Customer Management*

- Add new customers with information (name, phone, address and notes)
- Attaching the fuzzy search for your search customers
- Modifying customer information (deletion requires admin approval)

*3. Order Tracking*

- Track paid and unpaid orders for a specific customer


*4. Order Management*

- Create Orders (Purchase or Quotation)
- See all orders (paid, unpaid, incomplete and quotation order)
- Create distinct order numbers automatically based on the schema `YYYYMMDD+00`
- Mark as paid or fulfiled orders
- Export orders as PDFs or images

*5. Inventory Management*

- Add materials to the inventory
- Material stock levels and specifications updates
- Consume materials upon creating an order or update an existing one
- Load inventory from an Excel file
- Browse inventory by material classification and grade

*6. Steel Price Management*

- Automatically retrieve and show daily price values for stainless steel and carbon steel
- Keeping historical prices for later analysis

*7. Employee Management*

- Decline employees, and update their profile
- Update leave and overtime hours for employees
- Employee CRUD operations (View, Edit, Delete)

*8. Reporting and Analytics*

- Create and download as a PDF report for unpaid orders
- Process a monthly sale to appear as bar charts on the dashboard
- Display real-time information about outstanding sums (sum of unpaid orders)

*9. Notifications*

- Alert the users when inventory is low or not sufficient to place an order
- As a customer has overdue payments, notify the users

== 3.2 Non-functional requirements

*1. Performance requirements*

- Support a certain amount of concurrency (set according to the actual user scale) to ensure normal response under high concurrency.

- For batch operations such as order generation and inventory import, a faster response speed or a feasible background processing mechanism is required.


*2. Security*

- Login uses JWT Token verification to ensure communication security and reduce the risk of attack.

- Administrator permissions or key confirmation are required for sensitive operations (such as deleting orders, paying orders, importing inventory, registering new users, etc.).

- HTTPS is recommended for data transmission (especially login, order payment, etc.).


*3. Availability*

- The system interface is friendly and the operation process is simple, which is easy to get started quickly.

- Provide necessary error prompts, exception capture processing and log records to reduce the difficulty of use.


*4. Maintainability*

- Adopt modular design to develop and maintain login modules, order modules, inventory modules, customer modules, employee modules, etc. relatively independently.

- The data structure is clear and can be managed uniformly through database tables or documents.


*5. Scalability*

- Reserved interfaces are convenient for subsequent integration (such as docking with other financial systems, SMS reminders, third-party payments, etc.).

- The logic of quotation calculation and inventory update is configurable to meet the expansion requirements of more materials or more pricing methods in the future.


*6. Fault tolerance*

- There should be reasonable verification, prompts and fallback mechanisms for insufficient inventory, repeated customers, network failures, Excel import format errors, etc.


*7. Logs and audits*

- Key operations (such as order payment, order deletion, inventory modification, etc.) need to record operation logs to facilitate auditing and tracking problems.


*8. Deployment and environment requirements*

- The system can run in common server environments (Windows) and supports conventional databases (MySQL).

- It is recommended to use containerized deployment (Docker) to facilitate version management and horizontal expansion.



= 4. Database Design
#project-figure("picture/DatabaseDesign.png", [Database Design])
== 4.1 Tables
In this system I will use the mysql DB to store the data. And below is the tales of the DB which are created according to the main feathers of the system.

- User and Permissions : `users `
- Steel Prices: `daily_material_price `
- Order Management :  `orders`, `order_items` 
- Customer Management: `customers`
- Inventory Management :  `inventory`
- Employee Management:  `employees`, `employee_leaves`, `employee_overtimes`

== 4.2 Modules Division
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

== 4.3 ER Diagram
#project-figure("picture/DBER.png", [ER Diagram])
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

= 5. UML Diagram
== 5.1 Use Case Diagram
#project-figure("picture/usecase.png", [Use Case Diagram])
#pagebreak()
== 5.2 Flowchart
*1. User Registration & Administrator Review Process*
#project-figure("picture/flowchart1.png", [User Registration & Administrator Review Process], width: 60%)
This flowchart shows the process of user registration:

1. User registration: The user fills in the registration information.

2. Information verification:

   If the information is invalid, the system prompts the user to re-enter; 

   if the information is valid, the system saves it to the database and sets it to "pending review".

3. Administrator review: The administrator views the new user registration list:

4. If rejected, the user status is set to "inactive" and cannot log in.

5. If approved, the user status is set to "activated" and an activation notification is sent.

6. Process completion: After receiving the notification, the user can log in to the system and complete the registration process.

*2. Create order (sales/quotation) process*
#project-figure("picture/flowchart2.png", [Create Order (Sales/Quotation) Process], width: 
20%)
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

*3. Mark order payment process*
#project-figure("picture/flowchart3.png", [Mark Order Payment Process], width: 
80%)
The flowchart shows the process of order management:

1. Enter order management: The user enters the "Order Management" page and  can select an order to view.

2. Order status judgment:

   If the order has been paid, no operation is required and it returns to the order list directly.

   If the order has not been paid, the user can select "Mark as paid".

3. Authorization verification: The system determines whether the user has the authority to perform the operation:

   If there is no authority, it prompts that the operation is denied and requires the administrator password to be entered.

   If there is authority, the order status is set to paid and the operation log (including user ID and operation type) is recorded.

4. Complete the operation: Return to the order list and display the updated status, and the process ends.

== 5.3 Sequence Diagram
*1. Login Sequence Diagram*
#project-figure("picture/sequence1.png", [Login Sequence Diagram], width: 75%)
User input the username and password, system will verify the information if success will return the JWT Token. If fail the system will return the error message

*2. Register Process*
#project-figure("picture/sequence2.png", [Register Process], width: 75%)
Register process needs the admin to audit the request. If the admin approve the register the status of the user will set as the `active` .

*3.Home Page*
#project-figure("picture/sequence3.png", [Home Page], width: 80%)
When the user login successfully, system will show the steel price,, total outstanding balances and uncompleted orders is displayed on the homepage as a dashboard just like the home page in the odoo system .

*4. Production Order Process *
#project-figure("picture/sequence4.png", [Production Order Process], width: 80%)
Production order supports the weight or numbers to calculate the total price, choose customer can use fuzzy searching. If the inventory is insufficient inventory will show a alarm and you can add the inventory in the order page .

*5. Quotation Order Process*
#project-figure("picture/sequence5.png", [Quotation Order Process], width: 80%)
Quotation order will not reduce the inventory immediately which only contain the information of the order in the order list and give a tag "Quatation" in this order.Then you can change the order into the production order in order management system later. 

 

*6. Customer Management Process *
#project-figure("picture/sequence6.png", [Order Management Process], width: 80%)

Customer Manage can search the information of the customer and their own the historical orders. And it can export the unpaid order as the pdf. And it can pay order or delete the order .

*7. Inventory Management Process *
#project-figure("picture/sequence7.png", [Inventory Management Process], width: 80%)
Inventory Manage is used to check the available materials and specifications, and their numbers and weight. What's more the system provide a function to batch import, single item addition or modification functions, and inventory query.

*8. Order Management Process *
#project-figure("picture/sequence8.png", [Order Management Process], width: 80%)
Order management can check all the orders and sorted by payment status,order type and fullfilled status. Support to transform the quotation order into the formal order and user can pay the order in this model. 

*9. Employee Management Process *
#project-figure("picture/sequence9.png", [Employee Management Process], width: 80%)
Admin can add and delete the employees. Also can manage and record the leave and overtime.
#pagebreak()
= 6. Software 
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
= 7. Technology Stack

== 7.1 Frontend Technology Stack
- **React** - A JavaScript library for building user interfaces
- **React Router** - For frontend routing management, enabling navigation between different pages in a single-page application
- **React Query** - For data fetching, caching, and state management
- **Material UI (`@mui`)** - Provides ready-to-use UI component library and styling system
- **Axios** - HTTP client for communicating with backend APIs
- **React Hook Form** - A library that simplifies form handling and validation
- **JSPdf and html2canvas** - For generating PDF documents on the frontend
- **React Slick** - A component library for implementing carousel effects

== 7.2 Backend Technology Stack
- **Node.js** - A JavaScript runtime environment that allows running JavaScript on the server side
- **Express** - A web application framework for Node.js, simplifying routing handling and middleware use
- **Sequelize** - ORM library that maps JavaScript objects to database tables, simplifying database operations
- **MySQL (mysql2)** - A relational database for storing application data
- **JWT (jsonwebtoken)** - For generating and verifying tokens, implementing stateless authentication
- **bcryptjs** - For password hashing and verification, enhancing security
- **node-cron** - A scheduling library for automated tasks
- **Multer** - Middleware for handling file uploads
- **ExcelJS** - For generating and parsing Excel files
- **PDFKit** - For generating PDF documents on the server side
- **Puppeteer** - Headless browser for webpage screenshots and PDF generation
- **Handlebars** - Template engine for generating HTML content
- **dotenv** - For loading environment variables, managing configurations for different environments
- **cors** - For handling Cross-Origin Resource Sharing
- **express-rate-limit** - For limiting API request frequency, preventing abuse

== 7.3 Architecture
The project adopts a frontend-backend separation architecture, with the frontend building a single-page application and the backend providing RESTful API services.

== 7.4 Deployment Environment
- Domain：
  - Namesilo
- **Frontend Hosting**: 
  - **Vercel** - Cloud platform for static sites and serverless functions, providing automatic deployments, global CDN, and scaling

- **Database Hosting**:
  - **MySQL** (hosted on AWS RDS) - Managed relational database service providing easy setup, operations, and scaling

- **Backend Deployment**:
  - **AWS Elastic Beanstalk** - Easy-to-use service for deploying and scaling web applications, handling capacity provisioning, load balancing, and application health monitoring

- **Reverse Proxy/Load Balancing**:
  - **Nginx** - High-performance HTTP server and reverse proxy, providing load balancing, caching, and SSL termination

= 8. Methodology
#project-figure("picture/Agile.png", [Agile Methodology], width: 80%)
The Agile methodology was applied throughout the development of Smart Steel to
ensure flexibility and responsiveness to feedback. The project was divided into four
phases, each focused on delivering core features incrementally:

#project-figure("picture/AgileDev.png", [Agile Development Process], width: 80%)
- Phase 1: Requirements & Design
Analyzed user pain points: lack of industry-specific systems, diverse inventory
units, and need for weight-based order calculations
Defined core modules: User, Customer, Inventory, Order, Employee
Designed database schema and selected tech stack: MySQL + React + Node.js +
Express
Created wireframes and planned UI layouts (Order Management, Inventory,
Dashboard)
- Phase 2: Development Sprint 1
Implemented user authentication (login/register with JWT)
Developed basic inventory management: add/edit materials, specifications, and
quantity
Built customer management: add/search customers, link orders to customers
Set up GitHub version control and managed project branches
- Phase 3: Development Sprint 2 + Testing
Developed order system (Purchase & Quotation), with fuzzy search, autogenerated order numbers, and weight-based pricing
Added export functionality: generate image or PDF of orders (using html-toimage + jsPDF)
Tested features such as inventory deduction and unpaid order filtering
Optimized front-end UX: inline calculations and field validation
-  Phase 4: Deployment & Review
Created dashboard page with sales chart, real-time price scraping, and
outstanding amount summary
Deployed employee module to track leave and overtime
Deployed system to a remote server for demonstration
Collected feedback from instructors and peers, fixed bugs, and refined
#pagebreak()

= 9. Implementation
== 9.1 User Authentication
#project-figure("picture/loginPage.png", [Login Page], width: 60%)
The user authentication function combines the JWT (JSON Web Token) and Google reCAPTCHA mechanisms for secure user login, authentication and prevention of malicious attacks.

*1. JWT Token*
- Backend:
  - JWT Creation:
  After a user has successfully logged in, the backend generates a JWT containing basic information about the user (such as username, ID, role and status).
#code-block("js", ```
const token = jwt.sign(
  { 
    username: user.username, 
    userId: user.id,
    userRole: user.role,
    userStatus: user.status
  },
  process.env.SECRET
);
```)
  - JWT Verification:
  To ensure interface security, the JWT authentication middleware is set up on the backend to perform Token authentication when users access interfaces that require authentication.
  #code-block("js", ```
      const token = authHeader.split(' ')[1];
      const decoded = jwt.verify(token, process.env.SECRET);
  ```)
  
- Frontend:
  - JWT Token Storage:
 The front-end saves the Token and user information in the local (localStorage) and global state after the user has successfully logged in, so that it can be used for subsequent requests.#cite("[2]")
  #code-block("js", ```
  setToken(token);
  setUser(user);
  setIsAuthenticated(true);
  setRole(user.userRole || "employee");
  localStorage.setItem('token', token);
  localStorage.setItem('user', JSON.stringify(user));
  ```)
  - Request Interceptor Add Token
  The front-end sets up a request interceptor that automatically appends the Authorization header to every HTTP request sent, ensuring that APIs that require authentication can be accessed properly
  #code-block("js", ```
  instance.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`;
    }
    return config;
  },
  // ...
  );
  ```)

*2. Google reCAPTCHA*
- Frontend:
  - Introduction of the reCAPTCHA component
  Introduce the Google reCAPTCHA component on the login page and bind a callback function to handle the user's behaviour after completing authentication
  #code-block("js", ```
  import ReCAPTCHA from "react-google-recaptcha"; 
  import { RECAPTCHA_SITE_KEY } from "../config";

  const handleCaptchaChange = (value) => {
    setCaptchaValue(value);
  };

  {showCaptcha && (
    <Box sx={{ width: "100%", display: "flex", justifyContent: "center", marginY: 2 }}>
      <ReCAPTCHA
        sitekey={siteKey}
        onChange={handleCaptchaChange}
      />
    </Box>
  )}
```)
   - Configuring the reCAPTCHA Site Key
   #code-block("js", ```
   const RECAPTCHA_SITE_KEY = process.env.RECAPTCHA_SITE_KEY;
   ```)
- Backend:
When the backend processes a login request, if the number of consecutive failed login attempts by the user exceeds the set threshold (CAPTCHA_THRESHOLD), it validates the reCAPTCHA Token submitted by the frontend
#code-block("js", ```
if (user.failedLoginAttempts >= CAPTCHA_THRESHOLD && captchaToken) {
  try {
    const verifyUrl = `https://www.google.com/recaptcha/api/siteverify`;
    const formData = new URLSearchParams();
    formData.append('secret', secretKey);
    formData.append('response', captchaToken);
    
    const { data: verifyCaptchaResponse } = await axios.post(verifyUrl, formData, {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' }
    });
    
    if (!verifyCaptchaResponse.success) {
      return res.status(400).json({
        success: false,
        msg: 'CAPTCHA verification failed',
        requireCaptcha: true
      });
    }
  } catch (error) {
    // Error handling...
  }
}
```)

#code-block("js", ```
const loginRateLimiter = rateLimit({
  windowMs: 1 * 60 * 1000,  // 1 minutes window
  max: 5,                    // limit each IP to 5 requests per windowMs
  message: {
    success: false, 
    msg: 'Too many login attempts from this IP, please try again after 1 minutes'
  },
  standardHeaders: true,
  legacyHeaders: false,
});
```)  
== 9.2 Home Page
#project-figure("picture/HomePage1.png", [Home Page], width: 60%)
#project-figure("picture/HomePage2.png", [Home Page], width: 60%)
This is a warehouse management system home page based on React and Material UI development, through the statistics card, inventory pie charts and order list visual display business core data.The page intelligently displays different content based on user roles, with administrators able to view additional employee stats and market price trend charts, while regular employees only have access to basic business data.

*1. Statistics Card*
#code-block("js", ```
<Grid item xs={12} sm={isEmployee ? 4 : 6} md={isEmployee ? 4 : 3}>
              <MDBox mb={1.5}>
                <ComplexStatisticsCard
                  color="primary"
                  icon={<ShoppingCartOutlined style={{ fontSize: 26 }} />}
                  title="Orders"
                  count={stats.orders.total.toString()}
                  percentage={{
                    color: "success",
                    amount: "",
                    label: `Last month: ${stats.orders.previousMonth}`,
                  }}
                  onClick={() => handleNavigate('/orders')}
                />
              </MDBox>
            </Grid> 
```)
- Use the ComplexStatisticsCard component to display four types of statistical information:
  - total number of orders
  - number of stocks
  - number of customers
  - number of employees
- Each card contains an icon, title, statistics and a comparison of the previous month's data.
- Each card has a click function to navigate to the corresponding page.

*2. Inventory Pie Charts*
#code-block("js", ```
<MDBox mt={3}>
  <Grid container spacing={3} mb={4}>
    <Grid item xs={12} md={6}>
      <InventoryPieChart 
        material="201" 
        title="201 Stainless Steel Inventory" 
      />
    </Grid>
    <Grid item xs={12} md={6}>
      <InventoryPieChart 
        material="304" 
        title="304 Stainless Steel Inventory" 
      />
    </Grid>
  </Grid>
</MDBox>
```)  
- Display inventory as a pie chart using the InventoryPieChart component
- Show inventory for two stainless steel materials (201 and 304)
- Layout is split into two columns on a medium to large screen using the Grid component.
- Get the inventory data from the backend API
- Each pie chart has a hover effect that displays the total inventory quantity.

*3. Three-dimensional chart*
- SalesChart: Charting sales data
 - You can select the year and view mode (quarter, month, week) to display the sales data
- MaterialPriceChart: Showing Stainless Steel Price Trends
- MaterialPriceChart: Showing Hot Rolled Coil Price Trends
 - You can get the latest data by clicking the refresh button
 - All the data is from the Tushare API
- These charts are only visible to administrators and non-employee roles.
- Arrange in three columns on a medium to large screen using the Grid component.
*4. Order List*
- Use the OrderList component to display three types of orders:
  - Quoted Orders (Quote Orders)
  - Incomplete orders (Incomplete Orders)
  - Unpaid Orders.
- Each type of order has loading status, counting and updating functions.
- Unpaid Orders show total amount calculation
- Get different types of order data through API
*5. Assignment of Role Privileges*
#code-block("js", ```
const navigate = useNavigate();
const { role, hasPermission } = useContext(AuthContext);
const isEmployee = role === 'employee';

{/* Employee card - only visible to non-employee roles */}
{!isEmployee && (
  <Grid item xs={12} sm={6} md={3}>
    <MDBox mb={1.5}>
      <ComplexStatisticsCard
        color="error"
        icon={<PeopleOutlined style={{ fontSize: 26 }} />}
        title="Employees"
        count={stats.employees.total.toString()}
        percentage={{
          color: "success",
          amount: "",
          label: `New this month: ${stats.employees.newEmployees}`,
        }}
        onClick={() => handleNavigate('/employee')}
      />
    </MDBox>
  </Grid>
)}

{/* Chart area - only visible to non-employee roles */}
{!isEmployee && (
  <Grid container spacing={3} mb={4}>
    <Grid item xs={12} md={6}>
      <SalesChart />
    </Grid>
  </Grid>
)}
```)
- Get user role information via AuthContext
- Employee (employee) role:
  - Can't see the Employee stats card
  - Can't see the chart area (SalesChart and MaterialPriceChart).
  - Layout of card area adjusted to 4/4/4 instead of 3/3/3/3
- Non-employee roles (Administrator, etc.):
  - Viewable in its entirety
  - Includes employee stats and sales/price charts

== 9.3 Inventory Management
#project-figure("picture/inventoryPage.png", [Inventory Management], width: 60%)
This Inventory Management page provides complete management of steel inventory, including viewing, adding, deleting, searching and filtering, as well as Excel import and export functions.The system implements privilege control based on user roles, supports multiple view modes and low inventory warning to ensure inventory visualisation and efficient management.
- Excel Import and Export Function
  - Frontend Implementation #cite("[3]")
    - Use the ExcelJS library to parse the Excel file
    - Use the multer middleware to handle the file upload
    - Use the ExcelJS library to parse the Excel file
    - Use the multer middleware to handle the file upload
    - Use the ExcelJS library to parse the Excel file
    - Use the multer middleware to handle the file upload
  - Backend Implementation
    - Handling file uploads using multer middleware
    - Parsing Excel file content using ExcelJS library
    - Validating the data format and checking for security issues (presence of macros, compliance with templates)
    - Insert data into database
- Security Measures
  - Privilege Control:
    - Only administrators can import and export data
    #code-block("js", ```
      const { role } = useContext(AuthContext);
      const isEmployee = role === 'employee';
      const canManageInventory = !isEmployee;
    ```)  
  - Data validation:
    - Check for formula injection
    - Check for invalid characters
    - Check for required fields
    - Check for data type
  #code-block("js", ```
   // Validate each record to prevent malicious content or invalid format
    for (const [idx, item] of inventory.entries()) {
      const { material, specification, quantity, density } = item;
      
      // Check for formula injection
      if (isFormulaLike(material)) {
        return res.status(400).json({ success: false, msg: `Row ${idx+1} - material may contain a formula or unsafe content` });
      }
      if (isFormulaLike(specification)) {
        return res.status(400).json({ success: false, msg: `Row ${idx+1} - specification may contain a formula or unsafe content` });
      }
      
      // Validate only English characters and allowed punctuation
      if (!isValidText(material)) {
        return res.status(400).json({ success: false, msg: `Row ${idx+1} - material contains invalid characters` });
      }
      if (!isValidText(specification)) {
        return res.status(400).json({ success: false, msg: `Row ${idx+1} - specification contains invalid characters` });
      }
      
      // Validate required fields and types
      if (!material || typeof material !== 'string' || material.length > 100) {
        return res.status(400).json({ success: false, msg: `Row ${idx+1} - invalid material field` });
      }
      if (!specification || typeof specification !== 'string' || specification.length > 100) {
        return res.status(400).json({ success: false, msg: `Row ${idx+1} - invalid specification field` });
      }
      const qty = parseFloat(quantity);
      if (isNaN(qty) || qty < 0) {
        return res.status(400).json({ success: false, msg: `Row ${idx+1} - invalid quantity field` });
      }
      if (density !== '' && density !== undefined) {
        const den = parseFloat(density);
        if (isNaN(den) || den < 0) {
          return res.status(400).json({ success: false, msg: `Row ${idx+1} - invalid density field` });
        }
      }
    }
  ```)
  - Special Security Measures:
    #code-block("js", ```
      if (result.isSecurityWarning) {
        showSnackbar(
          `Security Warning: ${result.msg}`,
          'warning',
          10000
        );
      }
    ```)
    - Exception file handling: reject processing and log warnings when exceptions are detected
    - Server-side validation: all client-side validation is repeated on the server side

== 9.4 Order Management
=== 9.4.1 Order List
#project-figure("picture/orderPage.png", [Order Management], width: 60%)
OrderPage is an order management system interface that provides order list display with multi-criteria filtering functions (including by order type, payment status, completion status and customer name).The system implements role-based rights management, whereby ordinary employees can only view and manipulate the orders they create, while administrators can access and manage all orders.Users can view order details and create new orders according to their permissions, and support paging and advanced search functions.
=== 9.4.2 Order Detail Page
#project-figure("picture/orderDetailPage.png", [Order Detail Page], width: 60%)
OrderDetailPage is the detail page component of the order management system, which mainly provides the following functions: displaying the complete information of the order (including customer information, order items, price details); providing different operation options according to the type of the order, such as converting the quotation into a formal sales order; supporting the management of the order status (labelled as paid/unpaid, completed/uncompleted); realising the order status management based on theRole-based access control, ordinary employees can only operate their own orders; provide order export function, orders can be exported to PDF or image format for printing or sending to customers.

The PDF export function of the system uses a combination of front-end and back-end implementation:

- Front-end implementation
  - JSPdf and html2canvas technology portfolio: the front-end mainly using the two libraries to work together to complete the PDF export
    - html2canvas is responsible for rendering HTML elements into canvas objects
    - jsPDF canvas will be converted to PDF documents
    - implementation process: the first order details page DOM elements converted to images, and then insert the image into the PDF document, and finally generate downloadable PDF documents
    #code-block("js", ```
    /**
 * Generate Order PDF
 * Note: Employee users can only generate PDF for their own orders
 * @param {number} orderId - Order ID
 * @returns {Promise<Object>} Return generation result
 */
export const generateOrderPDF = async (orderId) => {
  try {
    const response = await instance.get(`/orders/${orderId}/pdf`, {
      responseType: 'blob'
    });
    
    // Create download link
    const url = window.URL.createObjectURL(new Blob([response.data]));
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `order-${orderId}.pdf`);
    document.body.appendChild(link);
    link.click();
    link.remove();
    window.URL.revokeObjectURL(url);
    
    return { success: true };
  } catch (error) {
    return handleError(error, 'Failed to generate PDF');
  }
};
```)
- Back-end implementation
  - PDFKit library: used to generate more complex server-side PDF documents
    - Precise control over PDF layout, fonts and images
    - Used to generate formal order documents and reports containing company logos and formatted data.
  - Puppeteer Headless Viewer:
    - For generating high quality order screenshots and PDFs
    - Full rendering of pages with CSS styling.
    - Support for custom page sizes and printing parameters
    #code-block("js", ```
// PDF generation interface in WarehouseAPI/routes/orderRoutes.js
router.get('/:id/pdf', employeeOrderAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const order = await Order.findByPk(id, {
      include: [
        { model: Customer },
        { model: User },
        { model: OrderItem }
      ]
    });

    if (!order) {
      return res.status(404).json({ success: false, msg: 'Order not found' });
    }

    // Prepare template data
    const templateData = {
      order_number: order.order_number,
      order_type: order.order_type === 'QUOTE' ? 'Quote' : 'Sales',
      is_sales: order.order_type === 'SALES',
      created_at: new Date(order.created_at).toLocaleString(),
      // Other fields...
      generated_date: new Date().toLocaleDateString()
    };

    // Use a general PDF generation tool to generate PDF
    const pdfBuffer = await generatePDF(templateData, 'order');
    
    // Send PDF response
    sendPDFResponse(res, pdfBuffer, `order-${order.order_number}.pdf`);
  } catch (err) {
    handlePDFError(res, err);
  }
});
```)
=== 9.4.3 Order Create Page
#project-figure("picture/CreateOrderPage.png", [Order Create Page], width: 60%)
The Create Order page implements multi-functional order management, supporting the creation of both Sales Orders and Quotations.The page has an intelligent inventory checking function, which pops up a warning dialogue box when the inventory is insufficient, displays the number of missing items and provides the option to jump to the inventory management page directly.Order calculation supports two special methods: quantity-based calculation (unit price x quantity) or weight-based calculation (unit price x weight), which meets the needs of the steel industry for pricing by piece or by weight.The system integrates customer selection, dynamic loading of material specifications, multi-item addition and calculation functions, and automatic generation of order numbers to achieve an efficient order creation process.
#pagebreak()
Specific Price Calculation Method (Quantity/Weight Dual Mode Calculation) Code
#code-block("js", ```
// Calculate subtotal amount, supports calculation based on quantity or weight
if ((field === 'quantity' || field === 'weight' || field === 'unit_price') && 
    (newItems[index].weight || newItems[index].quantity) && 
    newItems[index].unit_price) {
    // Calculate based on weight or quantity
    if (newItems[index].weight && parseFloat(newItems[index].weight) > 0) {
        newItems[index].subtotal = (parseFloat(newItems[index].weight) * parseFloat(newItems[index].unit_price)).toFixed(2);
    } else if (newItems[index].quantity && parseFloat(newItems[index].quantity) > 0) {
        newItems[index].subtotal = (parseFloat(newItems[index].quantity) * parseFloat(newItems[index].unit_price)).toFixed(2);
    }
}
```)
Inventory shortage checking and pop-up window handling code
#code-block("js", ```
// Check if the inventory is sufficient if it is a sales order
if (orderType === 'SALES') {
    const insufficient = [];
    
    // Refresh inventory data to ensure the latest data is used
    try {
        const freshInventoryResponse = await fetchAllInventory();
        if (freshInventoryResponse.success) {
            // Use the latest inventory data for checking
            const freshInventory = freshInventoryResponse.inventory || freshInventoryResponse.data || [];
            
            for (const item of orderItems) {
                console.log(`Checking inventory: material=${item.material}, specification=${item.specification}, required quantity=${item.quantity}`);
                
                // Standardize the query conditions, remove leading and trailing spaces
                const material = item.material.trim();
                const specification = item.specification.trim();
                
                // Try three ways to find a matching inventory item
                let inventoryItem = freshInventory.find(inv => 
                    inv.material.trim().toLowerCase() === material.toLowerCase() && 
                    inv.specification.trim().toLowerCase() === specification.toLowerCase()
                );
                
                // If no exact match is found, try fuzzy matching
                if (!inventoryItem) {
                    // Matching logic...
                }
                
                // Inventory shortage calculation
                if (!inventoryItem) {
                    insufficient.push({
                        material: item.material,
                        specification: item.specification,
                        required: parseFloat(item.quantity),
                        available: 0,
                        missing: parseFloat(item.quantity)
                    });
                    continue;
                }
                
                const availableQty = parseFloat(inventoryItem.quantity);
                const requiredQty = parseFloat(item.quantity);
                
                if (availableQty < requiredQty) {
                    insufficient.push({
                        material: item.material,
                        specification: item.specification,
                        required: requiredQty,
                        available: availableQty,
                        missing: requiredQty - availableQty
                    });
                }
            }
        }
        
        // If there are items with insufficient inventory, display a dialog box
        if (insufficient.length > 0) {
            setInsufficientItems(insufficient);
            setInventoryDialog(true);
            return;
        }
    } catch (error) {
        console.error("Error refreshing inventory:", error);
        alert("Error checking inventory, please try again");
        return;
    }
}
```)
#pagebreak()

= References
#label("references")

#set par(justify: true)

[1] Odoo S.A. (2023). Odoo Inventory Management. https://www.odoo.com/app/inventory

[2] JWT.io. (2023). JSON Web Token Documentation. https://jwt.io/

[3] ExcelJS. (2023). ExcelJS Documentation. https://github.com/exceljs/exceljs/blob/master/README_zh.md
