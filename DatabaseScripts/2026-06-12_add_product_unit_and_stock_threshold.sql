IF COL_LENGTH('Products', 'Unit') IS NULL
BEGIN
    ALTER TABLE Products
    ADD Unit NVARCHAR(20) NOT NULL
        CONSTRAINT DF_Products_Unit DEFAULT N'sản phẩm';
END
GO

IF COL_LENGTH('Products', 'LowStockThreshold') IS NULL
BEGIN
    ALTER TABLE Products
    ADD LowStockThreshold DECIMAL(18, 2) NOT NULL
        CONSTRAINT DF_Products_LowStockThreshold DEFAULT 10;
END
GO

IF EXISTS (
    SELECT 1
    FROM sys.columns c
    JOIN sys.types t ON c.user_type_id = t.user_type_id
    WHERE c.object_id = OBJECT_ID('Products')
      AND c.name = 'Stock'
      AND t.name <> 'decimal'
)
BEGIN
    DECLARE @StockDefaultConstraint NVARCHAR(128);
    DECLARE @DropStockDefaultSql NVARCHAR(MAX);

    SELECT @StockDefaultConstraint = dc.name
    FROM sys.default_constraints dc
    JOIN sys.columns c
        ON c.default_object_id = dc.object_id
    WHERE dc.parent_object_id = OBJECT_ID('Products')
      AND c.name = 'Stock';

    IF @StockDefaultConstraint IS NOT NULL
    BEGIN
        SET @DropStockDefaultSql = N'ALTER TABLE Products DROP CONSTRAINT [' + @StockDefaultConstraint + N']';
        EXEC sp_executesql @DropStockDefaultSql;
    END

    ALTER TABLE Products
    ALTER COLUMN Stock DECIMAL(18, 2) NOT NULL;
END
GO

IF NOT EXISTS (
    SELECT 1
    FROM sys.default_constraints dc
    JOIN sys.columns c
        ON c.default_object_id = dc.object_id
    WHERE dc.parent_object_id = OBJECT_ID('Products')
      AND c.name = 'Stock'
)
BEGIN
    ALTER TABLE Products
    ADD CONSTRAINT DF_Products_Stock DEFAULT 100 FOR Stock;
END
GO

UPDATE Products
SET Unit = CASE
    WHEN Unit IS NULL OR LTRIM(RTRIM(Unit)) = '' THEN N'sản phẩm'
    ELSE Unit
END,
LowStockThreshold = CASE
    WHEN LowStockThreshold IS NULL OR LowStockThreshold <= 0 THEN 10
    ELSE LowStockThreshold
END;
GO
