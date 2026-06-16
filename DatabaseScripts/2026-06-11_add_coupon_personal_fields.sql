USE [BaseCoreSales]
GO

IF COL_LENGTH('dbo.Coupons', 'CouponType') IS NULL
BEGIN
    ALTER TABLE [dbo].[Coupons]
    ADD [CouponType] [nvarchar](20) NOT NULL
        CONSTRAINT [DF_Coupons_CouponType] DEFAULT ('Public')
END
GO

IF COL_LENGTH('dbo.Coupons', 'UserId') IS NULL
BEGIN
    ALTER TABLE [dbo].[Coupons]
    ADD [UserId] [nvarchar](450) NULL
END
GO

IF COL_LENGTH('dbo.Coupons', 'MinOrderAmount') IS NULL
BEGIN
    ALTER TABLE [dbo].[Coupons]
    ADD [MinOrderAmount] [decimal](18, 2) NULL
END
GO

IF COL_LENGTH('dbo.Coupons', 'UsageLimit') IS NULL
BEGIN
    ALTER TABLE [dbo].[Coupons]
    ADD [UsageLimit] [int] NULL
END
GO

IF COL_LENGTH('dbo.Coupons', 'UsedCount') IS NULL
BEGIN
    ALTER TABLE [dbo].[Coupons]
    ADD [UsedCount] [int] NOT NULL
        CONSTRAINT [DF_Coupons_UsedCount] DEFAULT ((0))
END
GO

UPDATE [dbo].[Coupons]
SET [CouponType] = 'Public'
WHERE [CouponType] IS NULL OR LTRIM(RTRIM([CouponType])) = ''
GO

IF NOT EXISTS (
    SELECT 1
    FROM sys.check_constraints
    WHERE name = 'CK_Coupons_CouponType'
)
BEGIN
    ALTER TABLE [dbo].[Coupons]
    ADD CONSTRAINT [CK_Coupons_CouponType]
    CHECK ([CouponType] IN ('Public', 'Personal', 'Loyalty'))
END
GO

IF NOT EXISTS (
    SELECT 1
    FROM sys.foreign_keys
    WHERE name = 'FK_Coupons_Users'
)
BEGIN
    ALTER TABLE [dbo].[Coupons] WITH CHECK
    ADD CONSTRAINT [FK_Coupons_Users]
    FOREIGN KEY([UserId]) REFERENCES [dbo].[Users] ([Id])
END
GO
