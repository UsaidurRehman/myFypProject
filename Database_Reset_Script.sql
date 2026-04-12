-- =========================================================================
-- DATABASE RESET & DUMMY DATA SCRIPT
-- Run this in SQL Server Management Studio (SSMS)
-- =========================================================================

-- 1) DELETE ANY EXISTING (OR BUGGY) DATA
DELETE FROM Experience;
DELETE FROM Worker_Category;
DELETE FROM Worker;
DELETE FROM Client;
DELETE FROM Interview;

-- 2) RESET THE ID COUNTERS BACK TO ZERO 
-- (Ensures new accounts start exactly at ID = 1)
DBCC CHECKIDENT ('Worker', RESEED, 0);
DBCC CHECKIDENT ('Client', RESEED, 0);
DBCC CHECKIDENT ('Interview', RESEED, 0);
DBCC CHECKIDENT ('Experience', RESEED, 0);

-- OPTIONAL: IF YOU WANT TO MANUALLY RE-INSERT THE DUMMY DATA, UNCOMMENT THE CODE BELOW
/*
-- =========================================================================
-- 3) CLIENTS
-- =========================================================================
INSERT INTO Client (Name, Email, Password, Phone, Address, Picture)
VALUES 
('Zainab Ahmed', 'zainab.ahmed@gmail.com', 'password123', '0300-1234567', 'DHA Phase 6, Karachi', 'zainab_client.jpg'),
('Aashiq Rehman', 'aashiq.r@yahoo.com', 'password123', '0333-9876543', 'Shamsabad, Rawalpindi', 'aashiq_client.jpg'),
('Humaira Khan', 'humaira.k@gmail.com', 'password123', '0345-4567890', '22 Number Chungi, Rawalpindi', 'humaira_client.jpg'),
('Huzaifa Ali', 'huzaifa.ali@hotmail.com', 'password123', '0312-3456789', 'Chandni Chowk, Rawalpindi', 'huzaifa_client.jpg');

-- =========================================================================
-- 4) WORKERS
-- =========================================================================
INSERT INTO Worker (Name, Cnic, Phone, Salary, Address, Picture, Available_Status, Category_ID, Age, Password, Gender)
VALUES 
('Sajid Mahmood', '37405-1234567-1', '0301-2345678', 35000, 'Tench Bhata, Rawalpindi', 'sajid_worker.jpg', 1, 1, 35, 'worker123', 'Male'),
('Kalsoom Bibi', '37405-7654321-2', '0331-5432109', 25000, 'Sadiqabad, Rawalpindi', 'kalsoom_worker.jpg', 1, 2, 42, 'worker123', 'Female'),
('Tariq Jameel', '37405-9988776-1', '0344-1122334', 40000, 'Saddar, Rawalpindi', 'tariq_worker.jpg', 1, 3, 29, 'worker123', 'Male'),
('Ayesha Noor', '37405-5556667-2', '0302-9988776', 30000, 'Commercial Market, Rawalpindi', 'ayesha_worker.jpg', 1, 4, 25, 'worker123', 'Female');

-- =========================================================================
-- 5) WORKER CATEGORY (Junction Table)
-- =========================================================================
INSERT INTO Worker_Category (Worker_ID, Category_ID, Skills_ID) VALUES (1, 1, 1);
INSERT INTO Worker_Category (Worker_ID, Category_ID, Skills_ID) VALUES (1, 1, 2);
INSERT INTO Worker_Category (Worker_ID, Category_ID, Skills_ID) VALUES (2, 2, 3);
INSERT INTO Worker_Category (Worker_ID, Category_ID, Skills_ID) VALUES (2, 2, 4);
INSERT INTO Worker_Category (Worker_ID, Category_ID, Skills_ID) VALUES (3, 3, 5);
INSERT INTO Worker_Category (Worker_ID, Category_ID, Skills_ID) VALUES (4, 4, 7);

-- =========================================================================
-- 6) EXPERIENCE
-- =========================================================================
INSERT INTO Experience (Duration, Work_At, Exp_Detail, Worker_ID)
VALUES 
('5 Years', 'Uber & InDrive', '5 years driving manual and automatic vehicles in Rawalpindi/Islamabad blockades without any accident.', 1),
('3 Years', 'DHA Phase 2 Homes', 'Provided regular deep cleaning and sweeping duties for 3 large villas.', 2),
('2 Years', 'Monal Restaurant, Isb', 'Worked as an assistant chef focusing on Desi cuisine.', 3),
('1 Year', 'Roots Millennium', 'Worked as a nursery assistant managing up to 10 toddlers at once.', 4);
*/
