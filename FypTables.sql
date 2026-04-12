CREATE TABLE Client (
    Client_ID INT PRIMARY KEY IDENTITY(1,1),
    Name VARCHAR(100) NOT NULL,
    Email VARCHAR(100) UNIQUE NOT NULL,
    Phone VARCHAR(20) NOT NULL,
    Password VARCHAR(255) NOT NULL, -- Hashed
    Address TEXT,
    Picture VARCHAR(255)
);


CREATE TABLE Category (
    Category_ID INT PRIMARY KEY IDENTITY(1,1),
    Category_Name VARCHAR(50) NOT NULL
);


CREATE TABLE Skills (
    Skills_ID INT PRIMARY KEY IDENTITY(1,1),
    Category_ID INT,
    Skill_Name VARCHAR(100),
    FOREIGN KEY (Category_ID) REFERENCES Category(Category_ID)
)


CREATE TABLE Worker (
    Worker_ID INT PRIMARY KEY IDENTITY(1,1),
    Name VARCHAR(100) NOT NULL,
    Cnic VARCHAR(20) UNIQUE NOT NULL,
    Phone VARCHAR(20) NOT NULL,
    Salary DECIMAL(10, 2),
    Address TEXT,
    Picture VARCHAR(255),
    Available_Status BIT DEFAULT 1, -- 1 for Available, 0 for Booked
    Category_ID INT,
    FOREIGN KEY (Category_ID) REFERENCES Category(Category_ID)
);


CREATE TABLE Experience (
    Experience_ID INT PRIMARY KEY IDENTITY(1,1),
    Worker_ID INT,
    Work_At VARCHAR(150),
    Exp_Detail TEXT,
    Duration VARCHAR(50), -- e.g., "2 Years"
    FOREIGN KEY (Worker_ID) REFERENCES Worker(Worker_ID)
);


CREATE TABLE Interview (
    Interview_ID INT PRIMARY KEY IDENTITY(1,1),
    Client_ID INT,
    Worker_ID INT,
    Interview_Date DATETIME,
    Address TEXT,
    Status VARCHAR(50), -- e.g., Pending, Completed, Cancelled
    Hiring_Decision VARCHAR(50), -- e.g., Hired, Rejected
    FOREIGN KEY (Client_ID) REFERENCES Client(Client_ID),
    FOREIGN KEY (Worker_ID) REFERENCES Worker(Worker_ID)
);


CREATE TABLE Reviews (
    Review_ID INT PRIMARY KEY IDENTITY(1,1),
    Interview_ID INT, -- Linking to the specific hiring instance
    Rating INT CHECK (Rating BETWEEN 1 AND 5),
    Comment TEXT,
    ReviewDate DATETIME DEFAULT GETDATE(),
    FOREIGN KEY (Interview_ID) REFERENCES Interview(Interview_ID)
);


CREATE TABLE Termination (
    Termination_ID INT PRIMARY KEY IDENTITY(1,1),
    Interview_ID INT,
    Terminated_Date DATE,
    Terminated_Reason TEXT,
    FOREIGN KEY (Interview_ID) REFERENCES Interview(Interview_ID)
);



CREATE TABLE Resignation (
    Resignation_ID INT PRIMARY KEY IDENTITY(1,1),
    Interview_ID INT,
    Resignation_Reason TEXT NOT NULL,
    Last_Working_Date DATE NOT NULL,
    Submitted_Date DATETIME DEFAULT GETDATE(),
    FOREIGN KEY (Interview_ID) REFERENCES Interview(Interview_ID)
);